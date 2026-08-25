package com.example.webapp.service;

import org.springframework.stereotype.Service;
import java.io.*;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Enumeration;

@Service
public class LicenseService {

    // Hardcoded RSA 2048-bit Public Key in Base64
    private static final String PUBLIC_KEY_BASE64 = 
        "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApJbDiGBy3yLmz+ert9XkYb2IldwwvZ4hBCbaHGwKv+nFBk83/" +
        "Hm9Qu50oODm6HnGzutyUKY7XHndL3T/JhWDDVTY0X2/bJxZyv4ANjJ9kFiEukNbmFaOdX1YbIXlSXxRZhqCp3i8dycHHn" +
        "NCmXywnQ5rO/2auu1mcnRDNpEDNcRsgieURGdIqPi6rrlif0g3t+I9sG19o3pgjCmJ/UW0mCi7livcLJ9wbfbiI0hyfSx" +
        "RLUD1YKPxCb/XzFYJDG0Nptb6ipsn9SU8X8bBjxxZR/bjxHxIYN5lyRMtODeAceUWjbtMGbOtcCQnxAufInRjVMSZcAa3" +
        "lnEz05hYLo2/hwIDAQAB";

    private static final String TRIAL_SECRET_SALT = "Dia1ProductManagerTrialSecretKeySalt_2026";
    private static final long TRIAL_DURATION_MS = 7L * 24 * 60 * 60 * 1000L; // 7 days

    private final File licenseFile;
    private final File persistentBackupTrialFile;
    private final File oldPrimaryTrialFile;
    private final File oldBackupTrialFile;
    private final String registryNodePath;

    public LicenseService() {
        this(
            new File(System.getProperty("user.home"), ".productmanager"),
            new File(System.getProperty("java.io.tmpdir")),
            getPersistentBackupDir(),
            "com/example/webapp/trial"
        );
    }

    private static File getPersistentBackupDir() {
        String appData = System.getenv("APPDATA");
        File dir = (appData != null) ? new File(appData, ".productmanager_backup") : new File(System.getProperty("user.home"), ".productmanager_backup");
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    LicenseService(File baseDir, File oldTempDir, File persistentBackupDir) {
        this(baseDir, oldTempDir, persistentBackupDir, "com/example/webapp/trial");
    }

    LicenseService(File baseDir, File backupDir) {
        this(baseDir, backupDir, backupDir, "com/example/webapp/trial_test");
    }

    LicenseService(File baseDir, File oldTempDir, File persistentBackupDir, String registryNodePath) {
        if (!baseDir.exists()) {
            baseDir.mkdirs();
        }
        this.licenseFile = new File(baseDir, "license.lic");
        this.oldPrimaryTrialFile = new File(baseDir, "trial.dat");
        this.oldBackupTrialFile = new File(oldTempDir, "trial_pm.dat");
        this.persistentBackupTrialFile = new File(persistentBackupDir, "trial_pm.dat");
        this.registryNodePath = registryNodePath;
    }

    /**
     * Gets the unique hardware-based Machine ID using hashed MAC address.
     */
    public String getMachineId() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (ni.isLoopback() || !ni.isUp() || ni.getHardwareAddress() == null) {
                    continue;
                }
                byte[] mac = ni.getHardwareAddress();
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] hash = md.digest(mac);
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < 8; i++) {
                    sb.append(String.format("%02X", hash[i]));
                    if (i % 2 == 1 && i < 7) {
                        sb.append("-");
                    }
                }
                return sb.toString();
            }
        } catch (Exception e) {
            // Fallback
        }
        return "OFFLINE-DESKTOP-ID";
    }

    /**
     * Checks the current license and trial status.
     */
    public LicenseStatus getLicenseStatus() {
        // 1. Check if license.lic is valid
        if (isLicenseValid()) {
            return LicenseStatus.LICENSED;
        }

        // 2. Check trial status
        TrialData trial = getAndSyncTrialData();

        long now = System.currentTimeMillis();
        // Clock rollback check
        if (now < trial.lastSeen) {
            // Clock went backward: establish new baseline but do not add elapsed time.
            trial.lastSeen = now;
            saveTrialData(trial);
        } else {
            // Clock is normal or moving forward.
            if (now > trial.highestTimeRecorded) {
                long progress = now - trial.highestTimeRecorded;
                trial.elapsedTimeMs += progress;
                trial.highestTimeRecorded = now;
            }
            trial.lastSeen = now;
            saveTrialData(trial);
        }

        // Expiry check
        if (trial.elapsedTimeMs > TRIAL_DURATION_MS) {
            return LicenseStatus.EXPIRED;
        }

        return LicenseStatus.TRIAL;
    }

    /**
     * Returns remaining trial days.
     */
    public int getDaysRemaining() {
        TrialData trial = getAndSyncTrialData();
        long remainingMs = TRIAL_DURATION_MS - trial.elapsedTimeMs;
        if (remainingMs <= 0) return 0;
        return (int) Math.ceil((double) remainingMs / (24 * 60 * 60 * 1000L));
    }

    /**
     * Activates the license key.
     */
    public boolean activateLicense(String licenseKey) {
        if (licenseKey == null || licenseKey.trim().isEmpty()) {
            return false;
        }
        if (verifyLicenseKey(licenseKey)) {
            try {
                FileWriter writer = new FileWriter(licenseFile);
                writer.write(licenseKey.trim());
                writer.close();
                writeLicenseToRegistry(licenseKey);
                return true;
            } catch (IOException e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Gets the license expiry date if licensed.
     */
    public String getExpiryDate() {
        if (!licenseFile.exists()) {
            return null;
        }
        try (BufferedReader reader = new BufferedReader(new FileReader(licenseFile))) {
            String key = reader.readLine();
            if (key == null) return null;
            String[] parts = key.split("\\.");
            if (parts.length != 2) return null;
            String data = new String(decodeBase64(parts[0]), StandardCharsets.UTF_8);
            String[] dataParts = data.split(";");
            if (dataParts.length >= 2) {
                return dataParts[1];
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    // Helper classes and methods

    private static class TrialData {
        long firstLaunch;
        long lastSeen;
        long elapsedTimeMs;
        long highestTimeRecorded;
        boolean tampered;

        TrialData(long firstLaunch, long lastSeen, long elapsedTimeMs, long highestTimeRecorded, boolean tampered) {
            this.firstLaunch = firstLaunch;
            this.lastSeen = lastSeen;
            this.elapsedTimeMs = elapsedTimeMs;
            this.highestTimeRecorded = highestTimeRecorded;
            this.tampered = tampered;
        }
    }

    private TrialData readTrialFromRegistry() {
        try {
            java.util.prefs.Preferences prefs = java.util.prefs.Preferences.userRoot().node(this.registryNodePath);
            long firstLaunch = prefs.getLong("firstLaunch", -1L);
            if (firstLaunch == -1L) {
                return null;
            }
            long lastSeen = prefs.getLong("lastSeen", firstLaunch);
            long elapsedTimeMs = prefs.getLong("elapsedTimeMs", 0L);
            long highestTimeRecorded = prefs.getLong("highestTimeRecorded", lastSeen);
            boolean tampered = prefs.getBoolean("tampered", false);
            String checksum = prefs.get("checksum", "");

            String expectedChecksum = computeNewChecksum(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, tampered);
            if (!expectedChecksum.equals(checksum)) {
                return new TrialData(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, true);
            }
            return new TrialData(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, tampered);
        } catch (Exception e) {
            return null;
        }
    }

    private void writeTrialToRegistry(TrialData data) {
        try {
            java.util.prefs.Preferences prefs = java.util.prefs.Preferences.userRoot().node(this.registryNodePath);
            prefs.putLong("firstLaunch", data.firstLaunch);
            prefs.putLong("lastSeen", data.lastSeen);
            prefs.putLong("elapsedTimeMs", data.elapsedTimeMs);
            prefs.putLong("highestTimeRecorded", data.highestTimeRecorded);
            prefs.putBoolean("tampered", data.tampered);
            prefs.put("checksum", computeNewChecksum(data.firstLaunch, data.lastSeen, data.elapsedTimeMs, data.highestTimeRecorded, data.tampered));
            prefs.flush();
        } catch (Exception e) {
            // ignore
        }
    }

    private TrialData getAndSyncTrialData() {
        TrialData registry = readTrialFromRegistry();
        TrialData persistentBackup = readTrialFile(persistentBackupTrialFile);

        if (registry == null && persistentBackup == null) {
            // Try to read old primary file
            TrialData oldPrimary = readTrialFile(oldPrimaryTrialFile);
            // Try to read old temp backup file
            TrialData oldBackup = readTrialFile(oldBackupTrialFile);

            TrialData migrated = null;
            if (oldPrimary != null && oldBackup != null) {
                long minFirstLaunch = Math.min(oldPrimary.firstLaunch, oldBackup.firstLaunch);
                long maxLastSeen = Math.max(oldPrimary.lastSeen, oldBackup.lastSeen);
                boolean tampered = oldPrimary.tampered || oldBackup.tampered;
                migrated = new TrialData(minFirstLaunch, maxLastSeen, maxLastSeen - minFirstLaunch, maxLastSeen, tampered);
            } else if (oldPrimary != null) {
                migrated = oldPrimary;
            } else if (oldBackup != null) {
                migrated = oldBackup;
            }

            if (migrated != null) {
                migrated.tampered = false;
                saveTrialData(migrated);

                try {
                    if (oldPrimaryTrialFile.exists()) {
                        oldPrimaryTrialFile.delete();
                    }
                    if (oldBackupTrialFile.exists()) {
                        oldBackupTrialFile.delete();
                    }
                } catch (Exception e) {
                    // ignore cleanup errors
                }

                return migrated;
            }

            long now = System.currentTimeMillis();
            TrialData newTrial = new TrialData(now, now, 0L, now, false);
            saveTrialData(newTrial);
            return newTrial;
        }

        if (registry != null && persistentBackup != null) {
            long maxElapsed = Math.max(registry.elapsedTimeMs, persistentBackup.elapsedTimeMs);
            long maxHighest = Math.max(registry.highestTimeRecorded, persistentBackup.highestTimeRecorded);
            long minFirstLaunch = Math.min(registry.firstLaunch, persistentBackup.firstLaunch);
            long maxLastSeen = Math.max(registry.lastSeen, persistentBackup.lastSeen);
            boolean tampered = registry.tampered || persistentBackup.tampered;

            TrialData synced = new TrialData(minFirstLaunch, maxLastSeen, maxElapsed, maxHighest, false);
            if (registry.elapsedTimeMs != maxElapsed || registry.highestTimeRecorded != maxHighest || registry.lastSeen != maxLastSeen) {
                saveTrialData(synced);
            }
            return synced;
        }

        TrialData valid = (registry != null) ? registry : persistentBackup;
        valid.tampered = false;
        saveTrialData(valid);
        return valid;
    }

    private TrialData readTrialFile(File file) {
        if (!file.exists()) {
            return null;
        }
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            java.util.List<String> lines = new java.util.ArrayList<>();
            String line;
            while ((line = br.readLine()) != null) {
                lines.add(line.trim());
            }

            if (lines.size() < 4) {
                return null;
            }

            if (lines.size() == 4) {
                long firstLaunch = Long.parseLong(lines.get(0));
                long lastSeen = Long.parseLong(lines.get(1));
                boolean tampered = Boolean.parseBoolean(lines.get(2));
                String checksum = lines.get(3);

                String expectedChecksum = computeOldChecksum(firstLaunch, lastSeen, tampered);
                if (!expectedChecksum.equals(checksum)) {
                    return new TrialData(firstLaunch, lastSeen, lastSeen - firstLaunch, lastSeen, true);
                }
                return new TrialData(firstLaunch, lastSeen, lastSeen - firstLaunch, lastSeen, tampered);
            } else if (lines.size() >= 6) {
                long firstLaunch = Long.parseLong(lines.get(0));
                long lastSeen = Long.parseLong(lines.get(1));
                long elapsedTimeMs = Long.parseLong(lines.get(2));
                long highestTimeRecorded = Long.parseLong(lines.get(3));
                boolean tampered = Boolean.parseBoolean(lines.get(4));
                String checksum = lines.get(5);

                String expectedChecksum = computeNewChecksum(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, tampered);
                if (!expectedChecksum.equals(checksum)) {
                    return new TrialData(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, true);
                }
                return new TrialData(firstLaunch, lastSeen, elapsedTimeMs, highestTimeRecorded, tampered);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private void saveTrialData(TrialData data) {
        writeTrialToRegistry(data);
        writeTrialFile(persistentBackupTrialFile, data);
    }

    private void writeTrialFile(File file, TrialData data) {
        try (PrintWriter pw = new PrintWriter(new FileWriter(file))) {
            pw.println(data.firstLaunch);
            pw.println(data.lastSeen);
            pw.println(data.elapsedTimeMs);
            pw.println(data.highestTimeRecorded);
            pw.println(data.tampered);
            pw.println(computeNewChecksum(data.firstLaunch, data.lastSeen, data.elapsedTimeMs, data.highestTimeRecorded, data.tampered));
        } catch (Exception e) {
            // ignore
        }
    }

    private String computeOldChecksum(long firstLaunch, long lastSeen, boolean tampered) {
        return computeChecksum(firstLaunch + ":" + lastSeen + ":" + tampered + ":" + TRIAL_SECRET_SALT);
    }

    private String computeNewChecksum(long firstLaunch, long lastSeen, long elapsedTimeMs, long highestTimeRecorded, boolean tampered) {
        return computeChecksum(firstLaunch + ":" + lastSeen + ":" + elapsedTimeMs + ":" + highestTimeRecorded + ":" + tampered + ":" + TRIAL_SECRET_SALT);
    }

    private String computeChecksum(String rawData) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(rawData.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String readLicenseFromRegistry() {
        try {
            java.util.prefs.Preferences prefs = java.util.prefs.Preferences.userRoot().node(this.registryNodePath);
            return prefs.get("licenseKey", null);
        } catch (Exception e) {
            return null;
        }
    }

    private void writeLicenseToRegistry(String key) {
        try {
            java.util.prefs.Preferences prefs = java.util.prefs.Preferences.userRoot().node(this.registryNodePath);
            if (key != null) {
                prefs.put("licenseKey", key.trim());
            } else {
                prefs.remove("licenseKey");
            }
            prefs.flush();
        } catch (Exception e) {
            // ignore
        }
    }

    private boolean isLicenseValid() {
        // 1. Check if local license file exists and is valid
        if (licenseFile.exists()) {
            try (BufferedReader br = new BufferedReader(new FileReader(licenseFile))) {
                String key = br.readLine();
                if (verifyLicenseKey(key)) {
                    // Sync to registry backup if not already present
                    writeLicenseToRegistry(key);
                    return true;
                }
            } catch (Exception e) {
                // ignore and fall through
            }
        }

        // 2. If file doesn't exist or is invalid, try to restore from Registry
        String registryKey = readLicenseFromRegistry();
        if (verifyLicenseKey(registryKey)) {
            try {
                FileWriter writer = new FileWriter(licenseFile);
                writer.write(registryKey.trim());
                writer.close();
                return true;
            } catch (IOException e) {
                // ignore and return true since the registry version is valid
                return true;
            }
        }

        return false;
    }

    private boolean verifyLicenseKey(String key) {
        if (key == null) return false;
        key = key.trim();
        String[] parts = key.split("\\.");
        if (parts.length != 2) {
            return false;
        }

        try {
            String dataStr = new String(decodeBase64(parts[0]), StandardCharsets.UTF_8);
            String signatureBase64 = parts[1];

            // 1. Verify RSA Signature
            if (!verifySignature(dataStr, signatureBase64)) {
                return false;
            }

            // 2. Parse and verify data fields
            String[] dataParts = dataStr.split(";");
            if (dataParts.length < 2) {
                return false;
            }

            String machineId = dataParts[0];
            String expiryStr = dataParts[1];

            // Verify Machine ID
            if (!getMachineId().equals(machineId)) {
                return false;
            }

            // Verify Expiry
            if (!"perpetual".equalsIgnoreCase(expiryStr)) {
                LocalDate expiry = LocalDate.parse(expiryStr, DateTimeFormatter.ISO_LOCAL_DATE);
                if (LocalDate.now().isAfter(expiry)) {
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean verifySignature(String data, String signatureBase64) {
        try {
            byte[] pubKeyBytes = decodeBase64(PUBLIC_KEY_BASE64);
            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(pubKeyBytes);
            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            PublicKey publicKey = keyFactory.generatePublic(keySpec);

            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initVerify(publicKey);
            sig.update(data.getBytes(StandardCharsets.UTF_8));
            return sig.verify(decodeBase64(signatureBase64));
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] decodeBase64(String base64Str) {
        try {
            return Base64.getDecoder().decode(base64Str);
        } catch (IllegalArgumentException e) {
            return Base64.getUrlDecoder().decode(base64Str);
        }
    }
}
