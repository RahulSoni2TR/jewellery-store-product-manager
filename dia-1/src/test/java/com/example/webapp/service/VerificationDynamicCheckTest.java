package com.example.webapp.service;

import com.example.webapp.models.Product;
import com.example.webapp.controller.ProductController;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class VerificationDynamicCheckTest {

    @Test
    public void testProductNull_ShouldReturnFalse() {
        assertFalse(ProductController.isProductVerified(null, 30));
    }

    @Test
    public void testVerificationDateNull_ShouldReturnFalse() {
        Product product = new Product();
        product.setVerificationStatus(1);
        product.setVerificationDate(null);

        assertFalse(ProductController.isProductVerified(product, 30));
    }

    @Test
    public void testVerificationStatusNotOne_ShouldReturnFalse() {
        Product product = new Product();
        product.setVerificationStatus(0); // Unverified status
        product.setVerificationDate(LocalDateTime.now().minusDays(5));

        assertFalse(ProductController.isProductVerified(product, 30));
    }

    @Test
    public void testVerifiedWithinFrequencyWindow_ShouldReturnTrue() {
        Product product = new Product();
        product.setVerificationStatus(1);
        // Verified 10 days ago, frequency is 30 days
        product.setVerificationDate(LocalDateTime.now().minusDays(10));

        assertTrue(ProductController.isProductVerified(product, 30));
    }

    @Test
    public void testVerifiedExactlyAtFrequencyBoundary_ShouldReturnTrue() {
        Product product = new Product();
        product.setVerificationStatus(1);
        // Verified exactly 30 days ago
        product.setVerificationDate(LocalDateTime.now().minusDays(30));

        assertTrue(ProductController.isProductVerified(product, 30));
    }

    @Test
    public void testVerifiedOutsideFrequencyWindow_ShouldReturnFalse() {
        Product product = new Product();
        product.setVerificationStatus(1);
        // Verified 31 days ago, frequency is 30 days
        product.setVerificationDate(LocalDateTime.now().minusDays(31));

        assertFalse(ProductController.isProductVerified(product, 30));
    }
}
