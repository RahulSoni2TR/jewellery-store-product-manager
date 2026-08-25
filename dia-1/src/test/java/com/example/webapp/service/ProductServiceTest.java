package com.example.webapp.service;

import com.example.webapp.models.Product;
import com.example.webapp.models.Rate;
import com.example.webapp.models.RateHistory;
import com.example.webapp.repository.ProductRepository;
import com.example.webapp.repository.RateRepository;
import com.example.webapp.repository.RateHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class ProductServiceTest {

    @TempDir
    Path tempQrDir;

    private ProductRepository mockProductRepository;
    private RateRepository mockRateRepository;
    private RateHistoryRepository mockRateHistoryRepository;
    private ProductService productService;

    @BeforeEach
    public void setUp() {
        mockProductRepository = Mockito.mock(ProductRepository.class);
        mockRateRepository = Mockito.mock(RateRepository.class);
        mockRateHistoryRepository = Mockito.mock(RateHistoryRepository.class);
        productService = new ProductService();

        // Inject dependencies and properties using ReflectionTestUtils
        ReflectionTestUtils.setField(productService, "productRepository", mockProductRepository);
        ReflectionTestUtils.setField(productService, "rateRepository", mockRateRepository);
        ReflectionTestUtils.setField(productService, "rateHistoryRepository", mockRateHistoryRepository);
        ReflectionTestUtils.setField(productService, "baseUrl", "http://localhost:18080");
        ReflectionTestUtils.setField(productService, "qrDir", tempQrDir.toString());
        ReflectionTestUtils.setField(productService, "qrPublicPath", "/uploads/qr_codes/");
    }

    @Test
    public void testRegenerateAllQRCodesWithDefaultBaseUrl() throws Exception {
        Product p1 = new Product();
        p1.setDesignNo("DES_101");
        
        Product p2 = new Product();
        p2.setDesignNo("DES_102");

        when(mockProductRepository.findAll()).thenReturn(List.of(p1, p2));

        int count = productService.regenerateAllQRCodes(null);

        assertEquals(2, count);
        assertEquals("/uploads/qr_codes/QR_DES_101.png", p1.getQrCodePath());
        assertEquals("/uploads/qr_codes/QR_DES_102.png", p2.getQrCodePath());

        // Verify files were actually created
        assertTrue(Files.exists(tempQrDir.resolve("QR_DES_101.png")));
        assertTrue(Files.exists(tempQrDir.resolve("QR_DES_102.png")));
    }

    @Test
    public void testRegenerateAllQRCodesWithCustomBaseUrl() throws Exception {
        Product p1 = new Product();
        p1.setDesignNo("DES_201");

        when(mockProductRepository.findAll()).thenReturn(List.of(p1));

        int count = productService.regenerateAllQRCodes("http://192.168.1.100:18080/");

        assertEquals(1, count);
        assertEquals("/uploads/qr_codes/QR_DES_201.png", p1.getQrCodePath());
        assertTrue(Files.exists(tempQrDir.resolve("QR_DES_201.png")));
    }

    @Test
    public void testUpdatePricesAutoCalculatesOtherKarats() {
        when(mockRateRepository.findByCommodity(Mockito.anyString())).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.save(Mockito.any(Rate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, java.math.BigDecimal> inputPrices = new java.util.HashMap<>();
        inputPrices.put("24.00", new java.math.BigDecimal("60000"));

        productService.updatePrices(inputPrices);

        org.mockito.ArgumentCaptor<Rate> rateCaptor = org.mockito.ArgumentCaptor.forClass(Rate.class);
        Mockito.verify(mockRateRepository, Mockito.times(5)).save(rateCaptor.capture());

        java.util.List<Rate> savedRates = rateCaptor.getAllValues();
        assertEquals(5, savedRates.size());

        java.util.Map<String, java.math.BigDecimal> savedMap = new java.util.HashMap<>();
        for (Rate r : savedRates) {
            savedMap.put(r.getCommodity(), r.getPrice());
        }

        assertEquals(0, new java.math.BigDecimal("60000").compareTo(savedMap.get("24.00")));
        assertEquals(0, new java.math.BigDecimal("55000").compareTo(savedMap.get("22.00")));
        assertEquals(0, new java.math.BigDecimal("45600").compareTo(savedMap.get("18.00")));
        assertEquals(0, new java.math.BigDecimal("36000").compareTo(savedMap.get("14.00")));
        assertEquals(0, new java.math.BigDecimal("24000").compareTo(savedMap.get("10.00")));
    }

    @Test
    public void testUpdatePricesUsesCustomRatiosFromDb() {
        // Mock custom ratios in DB
        Rate r22 = new Rate(); r22.setCommodity("22.00_percent"); r22.setPrice(new java.math.BigDecimal("0.9500"));
        Rate r18 = new Rate(); r18.setCommodity("18.00_percent"); r18.setPrice(new java.math.BigDecimal("0.8000"));
        
        when(mockRateRepository.findByCommodity("22.00_percent")).thenReturn(java.util.Optional.of(r22));
        when(mockRateRepository.findByCommodity("18.00_percent")).thenReturn(java.util.Optional.of(r18));
        when(mockRateRepository.findByCommodity("14.00_percent")).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.findByCommodity("10.00_percent")).thenReturn(java.util.Optional.empty());
        
        // Mock standard rates
        when(mockRateRepository.findByCommodity("24.00")).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.findByCommodity("22.00")).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.findByCommodity("18.00")).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.findByCommodity("14.00")).thenReturn(java.util.Optional.empty());
        when(mockRateRepository.findByCommodity("10.00")).thenReturn(java.util.Optional.empty());
        
        when(mockRateRepository.save(Mockito.any(Rate.class))).thenAnswer(invocation -> invocation.getArgument(0));

        java.util.Map<String, java.math.BigDecimal> inputPrices = new java.util.HashMap<>();
        inputPrices.put("24.00", new java.math.BigDecimal("100000"));

        productService.updatePrices(inputPrices);

        org.mockito.ArgumentCaptor<Rate> rateCaptor = org.mockito.ArgumentCaptor.forClass(Rate.class);
        Mockito.verify(mockRateRepository, Mockito.times(5)).save(rateCaptor.capture());

        java.util.List<Rate> savedRates = rateCaptor.getAllValues();
        java.util.Map<String, java.math.BigDecimal> savedMap = new java.util.HashMap<>();
        for (Rate r : savedRates) {
            savedMap.put(r.getCommodity(), r.getPrice());
        }

        // Custom ratios should be applied
        assertEquals(0, new java.math.BigDecimal("95000").compareTo(savedMap.get("22.00"))); // 100,000 * 0.95 = 95,000
        assertEquals(0, new java.math.BigDecimal("80000").compareTo(savedMap.get("18.00"))); // 100,000 * 0.80 = 80,000
        // Fallbacks to default ratios
        assertEquals(0, new java.math.BigDecimal("60000").compareTo(savedMap.get("14.00"))); // 100,000 * 0.60 = 60,000
        assertEquals(0, new java.math.BigDecimal("40000").compareTo(savedMap.get("10.00"))); // 100,000 * 0.40 = 40,000
    }
}
