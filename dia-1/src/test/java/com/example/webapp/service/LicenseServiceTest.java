package com.example.webapp.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class LicenseServiceTest {

    @TempDir
    File tempBaseDir;

    @TempDir
    File tempBackupDir;

    private LicenseService licenseService;

    // Private key matching the hardcoded public key for test generation
    private static final String PRIVATE_KEY_BASE64 = 
        "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCklsOIYHLfIubP56u31eRhvYiV3DC9niEEJtocbAq/6cUGTzf8eb1C7nSg4OboecbO63JQpjtced0vdP8mFYMNVNjRfb9snFnK/gA2Mn2QWIS6Q1uYVo51fVhsheVJfFFmGoKneLx3Jwcec0KZfLCdDms7/Zq67WZydEM2kQM1xGyCJ5REZ0io+LquuWJ/SDe34j2wbX2jemCMKYn9RbSYKLuWK9wsn3Bt9uIjSHJ9LFEtQPVgo/EJv9fMVgkMbQ2m1vqKmyf1JTxfxsGPHFlH9uPEfEhg3mXJEy04N4Bx5RaNu0wZs61wJCfEC58idGNUxJlwBreWcTPTmFgujb+HAgMBAAECggEAE+o2zEHDVH2Fc8LtSQgFTiWf/mYPXbo29ijPUQtqUjtdKXzHYkdxX5pjxp2VQwGNIoy5nx7mEDP3T/Pg9ZY6bmVa+3Tdhyz0mSEaccmyiMHf2XvR/ED+Ps1vuBM2zFP8XhWMw+p81LwGWqheoXIaxVOGen1JTh9F5fPBuDtb/z12+nIl+OPmi+6MMEAUo5ANDgvzNe/bkv1Dj5piRC0o69IcQld+wjlOfrJZKVxa8p0s3LKTZLpS3udCwEvoS2Pv402JWx0hRLPekWmWQXp1zhIa26TmNcnS4r1bU6wXLdj6PHR8X83+2gmdJcaRc9F/hObSoz+1WFFVLgNg2LhS3QKBgQC2WgYGuGPCdxur9f+tC4T6fz+bY9UR4/gOgbav7CquKtHnURdzpZcVwa9/HbE6h+Gx07nYqf/Q+yoOF6VXaYN4NeTg7G0zwMmCtDIPsYki7vqrYJwkqad/AmlxeXbEwIqsYzoj0R5PA3o7o9QN9UXFU0vxjSsY+FQ8/AHn6xMPXQKBgQDnEDBjwVE+FyQJ9KD+hp7icBeaieuf/hb89n56XImbnnI6x/lr9sSUVJ/Y4uFhEP3pwBaFkI+++WXSKCKQe5Ql7s3TJ7IHMUKSxq1zVhpD3Mt8XBIj2tqdTYuCQjfINxukjsNwr2z3gTUs1epyMDaCo2R+Y6VOOJJO5N7Lg51wMwKBgAihjjN3OtGTja3AARARwYORzlLukME+Bxm4rgr5pLOFt1W5kuCYb+RJvKLJpv/cOqSOHvfQZBliKgVsvRi8F8ry0hiLWEfg0ijrmor/njwXD6pY8ksR9KmgVZlXZHW/n1C1iaT0WvjmczyrbngSqfDDFo8iXW3bIzGXxAdUKxzJAoGAfJ9jqfnzKozqmCAD0SOkgDa61FP87L7rgSYlUzOj2HYd4AxJP2zJ28LEsAK2UlcKy88ZlpJApVz4COAyvECax9bD1lY7k9uCr41Osb1Hz0A/0+QIuKPqcxsG2ouCcI8gbqG9UYKcP+XFW1hI6auNSup7Yhu2ZbjnWHvimltzR7cCgYEAjcTP3SnK9rho/wjIK67oo2cGSLVN8pfOBlEPwLf7xb9HUKv/wWx4rdinSI2Gtc1pZZM4ZAGt/+qNzBgmckt25N/Rt7M3LeOWC4yUMmlaVfUvbXV33Im0WFqllULii4XMSr7NUvP3qNw587WE4pDeIjG0wxp/sv8Vq6w3Kvpn3Fo=";

    @BeforeEach
    public void setUp() throws Exception {
        try {
            java.util.prefs.Preferences.userRoot().node("com/example/webapp/trial_test").removeNode();
            java.util.prefs.Preferences.userRoot().flush();
        } catch (Exception e) {}
        licenseService = new LicenseService(tempBaseDir, tempBackupDir);
    }

    @AfterEach
    public void tearDown() throws Exception {
        try {
            java.util.prefs.Preferences.userRoot().node("com/example/webapp/trial_test").removeNode();
            java.util.prefs.Preferences.userRoot().flush();
        } catch (Exception e) {}
    }

    @Test
    public void testMachineId() {
        String machineId = licenseService.getMachineId();
        assertNotNull(machineId);
        assertFalse(machineId.isEmpty());
    }

    @Test
    public void testFirstLaunchTrialState() {
        LicenseStatus status = licenseService.getLicenseStatus();
        assertEquals(LicenseStatus.TRIAL, status);
        int remaining = licenseService.getDaysRemaining();
        assertEquals(7, remaining);
    }

    @Test
    public void testExpiredTrialState() throws Exception {
        // Manually write trial data indicating first launch was 11 days ago
        long firstLaunch = System.currentTimeMillis() - (11L * 24 * 60 * 60 * 1000L);
        long lastSeen = firstLaunch;
        boolean tampered = false;

        writeMockTrialData(firstLaunch, lastSeen, tampered);

        LicenseStatus status = licenseService.getLicenseStatus();
        assertEquals(LicenseStatus.EXPIRED, status);
        assertEquals(0, licenseService.getDaysRemaining());
    }

    @Test
    public void testClockRollbackNotBlocked() throws Exception {
        // Clock rollback check: lastSeen is in the future
        long firstLaunch = System.currentTimeMillis();
        long lastSeen = System.currentTimeMillis() + (1L * 24 * 60 * 60 * 1000L); // tomorrow
        boolean tampered = false;

        writeMockTrialData(firstLaunch, lastSeen, tampered);

        LicenseStatus status = licenseService.getLicenseStatus();
        // Rollback should not block the app anymore: should return TRIAL
        assertEquals(LicenseStatus.TRIAL, status);
    }

    @Test
    public void testLicenseActivationSuccess() throws Exception {
        String machineId = licenseService.getMachineId();
        String expiry = "2099-12-31"; // Valid way in future
        String data = machineId + ";" + expiry;

        // Generate dynamic key in test
        byte[] privKeyBytes = Base64.getDecoder().decode(PRIVATE_KEY_BASE64.replaceAll("\\s", ""));
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(privateKey);
        sig.update(data.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = sig.sign();

        String encodedData = Base64.getUrlEncoder().withoutPadding().encodeToString(data.getBytes(StandardCharsets.UTF_8));
        String encodedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        String licenseKey = encodedData + "." + encodedSignature;

        // Activate
        boolean activated = licenseService.activateLicense(licenseKey);
        assertTrue(activated);

        // Verify status changes to LICENSED
        LicenseStatus status = licenseService.getLicenseStatus();
        assertEquals(LicenseStatus.LICENSED, status);
        assertEquals(expiry, licenseService.getExpiryDate());
    }

    @Test
    public void testLicenseActivationInvalidSignature() {
        String machineId = licenseService.getMachineId();
        String expiry = "2099-12-31";
        String data = machineId + ";" + expiry;

        String encodedData = Base64.getUrlEncoder().withoutPadding().encodeToString(data.getBytes(StandardCharsets.UTF_8));
        String badSignature = Base64.getUrlEncoder().withoutPadding().encodeToString("badsig".getBytes());
        String badLicenseKey = encodedData + "." + badSignature;

        boolean activated = licenseService.activateLicense(badLicenseKey);
        assertFalse(activated);
        assertNotEquals(LicenseStatus.LICENSED, licenseService.getLicenseStatus());
    }

    @Test
    public void testLicenseRegistryBackupAndRestore() throws Exception {
        String machineId = licenseService.getMachineId();
        String expiry = "2099-12-31";
        String data = machineId + ";" + expiry;

        byte[] privKeyBytes = Base64.getDecoder().decode(PRIVATE_KEY_BASE64.replaceAll("\\s", ""));
        PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(privKeyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        PrivateKey privateKey = keyFactory.generatePrivate(keySpec);

        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(privateKey);
        sig.update(data.getBytes(StandardCharsets.UTF_8));
        byte[] signatureBytes = sig.sign();

        String encodedData = Base64.getUrlEncoder().withoutPadding().encodeToString(data.getBytes(StandardCharsets.UTF_8));
        String encodedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);
        String licenseKey = encodedData + "." + encodedSignature;

        boolean activated = licenseService.activateLicense(licenseKey);
        assertTrue(activated);

        File licenseFile = new File(tempBaseDir, "license.lic");
        assertTrue(licenseFile.exists());
        assertTrue(licenseFile.delete());
        assertFalse(licenseFile.exists());

        LicenseStatus status = licenseService.getLicenseStatus();
        assertEquals(LicenseStatus.LICENSED, status);
        assertTrue(licenseFile.exists());
    }

    // Helpers

    private void writeMockTrialData(long firstLaunch, long lastSeen, boolean tampered) throws Exception {
        String checksum = computeChecksum(firstLaunch, lastSeen, tampered);
        
        File primaryFile = new File(tempBaseDir, "trial.dat");
        File backupFile = new File(tempBackupDir, "trial_pm.dat");

        writeTrialFile(primaryFile, firstLaunch, lastSeen, tampered, checksum);
        writeTrialFile(backupFile, firstLaunch, lastSeen, tampered, checksum);
    }

    private void writeTrialFile(File file, long firstLaunch, long lastSeen, boolean tampered, String checksum) throws Exception {
        try (PrintWriter pw = new PrintWriter(file)) {
            pw.println(firstLaunch);
            pw.println(lastSeen);
            pw.println(tampered);
            pw.println(checksum);
        }
    }

    private String computeChecksum(long firstLaunch, long lastSeen, boolean tampered) throws Exception {
        String data = firstLaunch + ":" + lastSeen + ":" + tampered + ":" + "Dia1ProductManagerTrialSecretKeySalt_2026";
        java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
