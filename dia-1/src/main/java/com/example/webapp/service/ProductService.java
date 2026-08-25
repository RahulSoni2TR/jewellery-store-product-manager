package com.example.webapp.service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.example.webapp.entity.VerificationConfig;
import com.example.webapp.exceptions.ProductUpdateException;
import com.example.webapp.models.Category;
import com.example.webapp.models.Orders;
import com.example.webapp.models.Product;
import com.example.webapp.models.Rate;
import com.example.webapp.models.RateHistory;
import com.example.webapp.repository.CategoryRepository;
import com.example.webapp.repository.OrderRepository;
import com.example.webapp.repository.ProductRepository;
import com.example.webapp.repository.RateHistoryRepository;
import com.example.webapp.repository.RateRepository;
import com.example.webapp.repository.VerificationConfigRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import jakarta.transaction.Transactional;

@Service
public class ProductService {

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private RateRepository rateRepository;

	@Autowired
	private RateHistoryRepository rateHistoryRepository;
	

	@Autowired
	private OrderRepository orderRepository;
	
	@Autowired
	private CategoryRepository categoryRepository;
	
	@Autowired
	private VerificationConfigRepository settingRepository;
	
	@Value("${app.server.host}")
    private String serverHost;

    @Value("${app.server.port}")
    private String serverPort;
    
    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.qr-dir}")
    private String qrDir;

    @Value("${app.qr-public-path}")
    private String qrPublicPath;

    @Value("${save.uploads.path}")
    private String uploadDir;
    
    @Value("${delete.baseUploadDir.path}")
    private String baseUploadDir;

    private final DataFormatter dataFormatter = new DataFormatter();

   private static final Map<String, Long> nameToIdMap = new HashMap<>();

	    static {
	        nameToIdMap.put("Jadtar Register", 6L);
	        nameToIdMap.put("Jadtar Halfsets", 7L);
	        nameToIdMap.put("Jadtar Bangles / Bracelets", 8L);
	        nameToIdMap.put("Vilandi Halfsets", 9L);
	        nameToIdMap.put("Vilandi Bangles / Bracelets", 10L);
	        nameToIdMap.put("Diamond Bangles / Bracelets", 11L);
	        nameToIdMap.put("Diamond Pendants / Pendant Sets", 12L);
	        nameToIdMap.put("Diamond Halfsets", 13L);
	        nameToIdMap.put("OS Halfsets", 14L);
	        nameToIdMap.put("OS Bangles / Bracelets", 15L);
	        nameToIdMap.put("PG Bangles / Bracelets", 16L);
	        nameToIdMap.put("Only Earrings", 17L);
	        nameToIdMap.put("Chains", 18L);
	        nameToIdMap.put("Diamond Earrings", 19L);
	        nameToIdMap.put("Diamond Rings", 20L);
	    }

	    public static Long getIdForName(String name) {
	        return nameToIdMap.get(name);
	    }

	public Product findById(int a) {

		return new Product();
	}

	public void addProduct(Product product) {
		System.out.println("product values are " + product.getProductId() + " " + product.getItem());
		System.out.println("design no " + product.getDesignNo());
		Optional<Product> existingProduct = productRepository.findByDesignNo(product.getDesignNo());
		System.out.println("before inside here");
		if (existingProduct.isPresent()) {
			System.out.println("inside here");
			throw new IllegalArgumentException("Design number already exists");
		}
		System.out.println("outside here");
		productRepository.save(product);
	}

	@Transactional
	public void removeProduct(String productId) {
	    Optional<Product> productToDeleteOpt = productRepository.findByDesignNo(productId);

	    if (productToDeleteOpt.isPresent()) {
	        Product product = productToDeleteOpt.get();
	        Orders order = product.getOrders();

	        // 1) Delete files from disk (best-effort)
	        deleteFileIfExists(product.getImageUrl());
	        deleteFileIfExists(product.getQrCodePath());
	        
	        if (order != null) {
	            // Break bidirectional link
	            product.setOrders(null);             // Break reference in Product
	            order.setAssigned(false);            // Update flag
	            order.setAssignedProduct(null);      // Break reverse link in Order
	        }

	        // Save only Order, to persist changes
	        orderRepository.save(order);

	        // Now that order is detached, Hibernate won't try to cascade delete/insert it
	        productRepository.delete(product);
	    }
	}

	private void deleteFileIfExists(String publicPath) {
	    if (publicPath == null || publicPath.isEmpty()) return;

	    // Extract just the file name (unavailable.jpg, QR_xxx.png, etc.)
	    String fileName = publicPath.substring(publicPath.lastIndexOf('/') + 1);
System.out.println(fileName);
	    // ✅ Do not delete the default placeholder image
	    if (fileName.contains("unavailable")) {
	        return;
	    }

	    Path path = Paths.get(baseUploadDir + publicPath.replace("/", File.separator));

	    try {
	        Files.deleteIfExists(path);
	    } catch (IOException e) {
	        e.printStackTrace(); // or use logger
	    }
	}


	public String modifyProduct(int a, String s, String b, String n) {
		return "p";
	}

	public Page<Product> findAll(Pageable pageable) {
		return productRepository.findAll(pageable);
	}

	public List<Product> findProductsByCategoryId(Long categoryId) {
		return productRepository.findByCategoryIdAndOrdersIsNotNullAndDesignNoIsNotNull(categoryId);
	}

	public Optional<Product> findProductById(String productId) {
		return productRepository.findByDesignNo(productId);
	}
	
	public List<Product> getProductsByDesignNos(List<String> designNos) {
	    return productRepository.findByDesignNoIn(designNos);
	}


	public Optional<Product> findProductFromId(Long productId) {
		return productRepository.findById(productId);
	}
	
	public Optional<Orders> findByOrderId(String 	orderId){
		return orderRepository.findByOrderId(orderId);
	}
	
	public void saveOrders(Orders order){
		 orderRepository.save(order);
	}

	public Product updateProduct(String productId, Product updatedProduct, MultipartFile imageFile,String newOrderId) {
		Optional<Product> existingProductOpt = productRepository.findByDesignNo(productId);
		Optional<Product> alProduct = productRepository.findByDesignNo(updatedProduct.getDesignNo());
		if (alProduct.isPresent()) {
			Product alreadyProduct = alProduct.get();
			if (!alreadyProduct.getDesignNo().equals(productId)) {
				// System.out.println("came inside");
				throw new IllegalArgumentException("Design number already exists for a different product");
			}
		}
		if (existingProductOpt.isPresent()) {
			// System.out.println("product found");
			Product existingProduct = existingProductOpt.get();
			// Save the image if a new file isexistingProduct uploaded
			if (imageFile != null && !imageFile.isEmpty()) {
				String imageUrl = saveImageFile(imageFile);
				updatedProduct.setImageUrl(imageUrl);
			} else {
				// If no new image is uploaded, keep the existing image URL
				updatedProduct.setImageUrl(existingProduct.getImageUrl());
			}
			
			
			 // 3. Handle order ID reassignment
		    Orders oldOrder = existingProduct.getOrders();

		    // Check if the order ID has changed
		    if (oldOrder == null || !oldOrder.getOrderId().equals(newOrderId)) {
		        // a) Unassign old order
		        if (oldOrder != null) {
		            oldOrder.setAssigned(false);
		            oldOrder.setAssignedProduct(null);
		            orderRepository.save(oldOrder);
		        }

		        // b) Handle new order
		        Orders newOrder = orderRepository.findByOrderId(newOrderId).orElseGet(() -> {
	                Orders o = new Orders();
	                o.setOrderId(newOrderId);
	                o.setCategoryId(updatedProduct.getCategoryId());
	                return o;
	            });


		        // Prevent re-assigning if already taken
		        if (newOrder.isAssigned() && (newOrder.getAssignedProduct() == null ||
		                !newOrder.getAssignedProduct().getProductId().equals(existingProduct.getProductId()))) {
		            throw new ProductUpdateException("New Order ID is already assigned to another product.");
		        }

		        newOrder.setAssigned(true);
		        newOrder.setAssignedProduct(existingProduct);
		        orderRepository.save(newOrder);

		        // Update product's orderRef
		        existingProduct.setOrders(newOrder);
		    }

			existingProduct.setItem(updatedProduct.getItem());
			existingProduct.setPrice(updatedProduct.getPrice());
			existingProduct.setRemarks(updatedProduct.getRemarks());
			existingProduct.setImageUrl(updatedProduct.getImageUrl());
			existingProduct.setCategoryId(updatedProduct.getCategoryId());
			existingProduct.setSubCategoryId(updatedProduct.getSubCategoryId());
		   existingProduct.setCustomFields(updatedProduct.getCustomFields());
			existingProduct.setLabour(updatedProduct.getLabour());
			existingProduct.setLabourAll(updatedProduct.getLabourAll());
			existingProduct.setLabourP(updatedProduct.getLabourP());
			existingProduct.setGross(updatedProduct.getGross());
			existingProduct.setNet(updatedProduct.getNet());
			existingProduct.setKarat(updatedProduct.getKarat());
			existingProduct.setDesignNo(updatedProduct.getDesignNo());
			if (updatedProduct.getCategoryId() == 1) {

				existingProduct.setPcs(updatedProduct.getPcs());
				existingProduct.setDiamondsCt(updatedProduct.getDiamondsCt());
				existingProduct.setDiaRt(updatedProduct.getDiaRt());
				existingProduct.setOtherStonesCt(updatedProduct.getOtherStonesCt());
				existingProduct.setOtherStonesRt(updatedProduct.getOtherStonesRt());
			}
			if (updatedProduct.getCategoryId() == 2) {
				existingProduct.setVilandiCt(updatedProduct.getVilandiCt());
				existingProduct.setvRate(updatedProduct.getvRate());
				existingProduct.setDiamondsCt(updatedProduct.getDiamondsCt());
				existingProduct.setDiaRt(updatedProduct.getDiaRt());
				existingProduct.setBeadsCt(updatedProduct.getBeadsCt());
				existingProduct.setBdRate(updatedProduct.getBdRate());
				existingProduct.setPearlsGm(updatedProduct.getPearlsGm());
				existingProduct.setPrlRate(updatedProduct.getPrlRate());
				existingProduct.setStones(updatedProduct.getStones());
				existingProduct.setOthers(updatedProduct.getOthers());
				existingProduct.setSsPearlCt(updatedProduct.getSsPearlCt());
				existingProduct.setSsRate(updatedProduct.getSsRate());
				existingProduct.setOtherStonesCt(updatedProduct.getOtherStonesCt());
				existingProduct.setOtherStonesRt(updatedProduct.getOtherStonesRt());
			}

			if (updatedProduct.getCategoryId() == 4) {
				existingProduct.setVilandiCt(updatedProduct.getVilandiCt());
				existingProduct.setvRate(updatedProduct.getvRate());
				existingProduct.setStones(updatedProduct.getStones());
				existingProduct.setStRate(updatedProduct.getStRate());
				existingProduct.setBeadsCt(updatedProduct.getBeadsCt());
				existingProduct.setBdRate(updatedProduct.getBdRate());
				existingProduct.setPearlsGm(updatedProduct.getPearlsGm());
				existingProduct.setPrlRate(updatedProduct.getPrlRate());
				existingProduct.setSsPearlCt(updatedProduct.getSsPearlCt());
				existingProduct.setSsRate(updatedProduct.getSsRate());
				existingProduct.setRealStone(updatedProduct.getRealStone());
				existingProduct.setFitting(updatedProduct.getFitting());
				existingProduct.setMozonite(updatedProduct.getMozonite());
				existingProduct.setmRate(updatedProduct.getmRate());
			}
			if (updatedProduct.getCategoryId() == 5) {
				existingProduct.setNet(updatedProduct.getNet());
				existingProduct.setStones(updatedProduct.getStones());
				existingProduct.setStRate(updatedProduct.getStRate());
				existingProduct.setBeadsCt(updatedProduct.getBeadsCt());
				existingProduct.setBdRate(updatedProduct.getBdRate());
				existingProduct.setPearlsGm(updatedProduct.getPearlsGm());
				existingProduct.setPrlRate(updatedProduct.getPrlRate());
				existingProduct.setSsPearlCt(updatedProduct.getSsPearlCt());
				existingProduct.setSsRate(updatedProduct.getSsRate());
				existingProduct.setRealStone(updatedProduct.getRealStone());
				existingProduct.setFitting(updatedProduct.getFitting());
				existingProduct.setMozonite(updatedProduct.getMozonite());
				existingProduct.setmRate(updatedProduct.getmRate());
				existingProduct.setVilandiCt(updatedProduct.getVilandiCt());
				existingProduct.setvRate(updatedProduct.getvRate());
			}
			
			String qrUrl = baseUrl + "/loadProductByDesignNo/" + existingProduct.getDesignNo();

			try {
				Files.createDirectories(Paths.get(qrDir));
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			String qrFileName = "QR_" + existingProduct.getDesignNo() + ".png";
			String qrFilePath = qrDir + qrFileName;

			// 3. Generate QR
			try {
				generateQRCodeImage(qrUrl, qrFilePath);
			} catch (WriterException | IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			String qr_path=qrPublicPath + qrFileName;
			// 4. Save QR path in product
			existingProduct.setQrCodePath(qr_path);

			return productRepository.save(existingProduct);
		}
		return null; // Or throw an exception as appropriate
	}

	public static ModelMapper getConfiguredModelMapper() {
		ModelMapper modelMapper = new ModelMapper();
		modelMapper.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT).setSkipNullEnabled(true); // Skip
																												// null
																												// values
		return modelMapper;
	}
	
	public int getVerificationDays() {
        return settingRepository.findById(1L)
                .map(VerificationConfig::getVerificationDays)
                .orElse(1); // default to 1 if not present
    }

	public void setVerificationDays(int days) {
        if (days <= 0) throw new IllegalArgumentException("Verification days must be positive");

        VerificationConfig config = settingRepository.findById(1L).orElse(new VerificationConfig());
        config.setId(1L); // ensure ID=1
        config.setVerificationDays(days);
        settingRepository.save(config);
    }

	
	@PostMapping("/upload-image")
	public String saveImageFile(@RequestParam("imageFile") MultipartFile imageFile) {
	    try {
	        // Save directory
	        Files.createDirectories(Paths.get(uploadDir));

	        // Get file extension
	        String originalFilename = imageFile.getOriginalFilename();
	        String extension = "";
	        if (originalFilename != null && originalFilename.contains(".")) {
	            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
	        }

	        // Generate 8-digit random number
	        String newFileName = "IMG_" + String.format("%08d", (int)(Math.random() * 100_000_000)) + extension;

	        // Save file
	        Path filePath = Paths.get(uploadDir, newFileName);
	        imageFile.transferTo(filePath.toFile());

	        // Return path for frontend
	        return "/uploads/" + newFileName;

	    } catch (IOException e) {
	        e.printStackTrace();
	        return "Upload failed!";
	    }
	}


	public Page<Product> findByCategory(List<Integer> categories, Pageable pageable, String searchTerm) {

		if (categories == null || categories.isEmpty()) {
	        return productRepository.findProductsWithoutCategoryAndName(searchTerm, pageable);
	    }
		
		List<Integer> forbidden = Arrays.asList(1,2,3,4,5);
		if (categories.stream().noneMatch(forbidden::contains)) {
			List<Long> categoryLongs = categories.stream()
				    .map(Integer::longValue)
				    .collect(Collectors.toList());
		  return  productRepository.findBysubCategoryIdInAndItemContainingIgnoreCase(categoryLongs,searchTerm, pageable);
		}

	    return productRepository.findByCategoryIdInAndItemContainingIgnoreCase(categories,searchTerm, pageable);
	}
	
	public String getCategoryNameById(Long categoryId) {
	    return categoryRepository.findById(categoryId)
	        .map(Category::getCategoryName)
	        .orElse(null);  // or throw an exception if not found
	}


	public Page<Product> findWithoutCategory(Pageable pageable, String searchTerm) {
		System.out.println(searchTerm);
		if (searchTerm != null && !searchTerm.isEmpty()) {
			searchTerm = "%" + searchTerm + "%"; // Add wildcards
		} else {
			searchTerm = null; // Ensure NULL is passed when searchTerm is empty
		}
		return productRepository.findProductsWithoutCategoryAndName(searchTerm, pageable);
	}

	public List<Rate> getAllRates() {
		return rateRepository.findAll();
	}
	
	public List<Category> getAllCategories() {
		
		    return categoryRepository.findAll();
	}
	
@Transactional
public String updatePrices(Map<String, BigDecimal> prices) {

    // ✅ Karat percentage mapping (loaded dynamically from database with defaults)
    Map<String, BigDecimal> karatPercent = new HashMap<>();
    karatPercent.put("24.00", new BigDecimal("1.00"));
    karatPercent.put("22.00", getKaratPercentFromDb("22.00_percent", "0.9167"));
    karatPercent.put("18.00", getKaratPercentFromDb("18.00_percent", "0.76"));
    karatPercent.put("14.00", getKaratPercentFromDb("14.00_percent", "0.60"));
    karatPercent.put("10.00", getKaratPercentFromDb("10.00_percent", "0.40"));

    // ✅ Track user-provided fields (for audit)
    Set<String> userProvided = new HashSet<>(prices.keySet());

    // ✅ If 24KT present → auto calculate others
    BigDecimal base24 = prices.get("24.00");

    if (base24 != null && base24.compareTo(BigDecimal.ZERO) > 0) {

        for (Map.Entry<String, BigDecimal> entry : karatPercent.entrySet()) {

            String karat = entry.getKey();

            // ❗ Skip if user already provided (manual override)
            if (userProvided.contains(karat)) continue;

            BigDecimal percent = entry.getValue();

            // 👉 Calculate from 24KT
            BigDecimal calculated = base24.multiply(percent);

            // ✅ ROUND TO NEAREST 10
            calculated = calculated
                    .divide(BigDecimal.TEN, 0, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.TEN);

            prices.put(karat, calculated);
        }
    }

    // ✅ SAVE + HISTORY
    prices.forEach((commodity, price) -> {

        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            System.out.println("Invalid price for commodity: " + commodity);
            return;
        }

        Optional<Rate> existingRate = rateRepository.findByCommodity(commodity);
        BigDecimal oldPrice = existingRate.map(Rate::getPrice).orElse(null);

        // ✅ Skip if no change
        if (oldPrice != null && oldPrice.compareTo(price) == 0) {
            return;
        }

        // ✅ Save/update rate
        Rate rate = existingRate.orElseGet(Rate::new);
        rate.setCommodity(commodity);
        rate.setPrice(price);

        Rate savedRate = rateRepository.save(rate);

        // ✅ Save history
        RateHistory history = new RateHistory();
        history.setRate(savedRate);
        history.setCommodity(commodity);
        history.setOldPrice(oldPrice);
        history.setNewPrice(price);
        history.setUpdatedAt(LocalDateTime.now());

        rateHistoryRepository.save(history);
    });

    return "Prices updated successfully";
}

private BigDecimal getKaratPercentFromDb(String commodity, String defaultValue) {
    return rateRepository.findByCommodity(commodity)
            .map(Rate::getPrice)
            .orElse(new BigDecimal(defaultValue));
}

	public List<Rate> findAll() {
		return rateRepository.findAll();
	}

	public Page<Product> getFilteredProducts(
		    Long categoryId,
		    Long subCategoryId,
		    LocalDateTime startDate,
		    LocalDateTime endDate,
		    int page,
		    int size
		) {
		    Pageable pageable = PageRequest.of(page, size);

		    if (subCategoryId == null) {
		        return productRepository.findByCategoryIdAndCreateDateTimeBetweenAndOrdersIsNotNullAndDesignNoIsNotNull(
		            categoryId, startDate, endDate, pageable);
		    } else {
		        return productRepository.findByCategoryIdAndSubCategoryIdAndCreateDateTimeBetweenAndOrdersIsNotNullAndDesignNoIsNotNull(
		            categoryId, subCategoryId, startDate, endDate, pageable);
		    }
		}


	public void importProductsFromExcel(MultipartFile file, String categoryName) throws Exception {
		System.out.println("inside import product");
		Workbook workbook = null;
		String category = "";
		try {
			InputStream inputStream = file.getInputStream();
			workbook = new XSSFWorkbook(inputStream);
			if (categoryName.equals("1")) {
				category = "Diamond";
			}
			if (categoryName.equals("2")) {
				category = "Open Setting";
			}
			if (categoryName.equals("3")) {
				category = "Plain Gold";
			}
			if (categoryName.equals("4")) {
				category = "Vilandi";
			}
			if (categoryName.equals("5")) {
				category = "Jadtar";
			}

			Sheet sheet = workbook.getSheet(category);

			if (sheet == null) {
				throw new IllegalArgumentException("Sheet with name " + categoryName + " not found");
			}

			List<Product> products = new ArrayList<>();
			// System.out.println("before sheet iterate");
			Iterator<Row> rows = sheet.iterator();
			// System.out.println("after sheet iterate");
			int rowNumber = 0;

			if (category.equals("Diamond")) {
				while (rows.hasNext()) {
					System.out.println("inside rows diamond");
					Row currentRow = rows.next();

					// Skip the header row
					if (rowNumber == 0) {
						rowNumber++;
						continue;
					}
					
					if (isRowEmptyByIndexCell(currentRow)) {
			            System.out.println("Stopping at row " + rowNumber + " because index cell (0) is empty");
			            break;
			        }
					

					try {
						Product product = new Product();
						String designNo = dataFormatter.formatCellValue(currentRow.getCell(1));


						// Check if the designNo is unique
						if (designNo != null && !designNo.trim().isEmpty()) {
							while (productRepository.existsByDesignNo(designNo)) { // Add method to check uniqueness
								designNo = generateRandomDesignNo();
							}
						} else {
							// Generate a random design number if none is provided
							designNo = generateRandomDesignNo();
						}
						String orderId = getCellValue(currentRow.getCell(2));
						Optional<Orders> orderOpt = orderRepository.findByOrderId(orderId);
						Orders order;
						if (orderOpt.isPresent()) {
						    Orders existingOrder = orderOpt.get();
						    
						    if (existingOrder.isAssigned()) {
						        // Existing order is already assigned, generate a new unique one
						        String newOrderId = generateUniqueOrderIdForCategory(1);
						        
						        order = new Orders();
						        order.setOrderId(newOrderId);
						        order.setCategoryId(1);
						        order.setAssigned(true);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						       
						    } else {
						        // Existing order is not assigned, reuse it
						        order = existingOrder;
						        order.setAssigned(true);
						        order.setCategoryId(1);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						        
						    }
						} else {
						    // Create a fresh order with the provided ID
						    order = new Orders();
						    order.setOrderId(orderId);
						    order.setCategoryId(1);
						    order.setAssigned(true);
						    order.setAssignedProduct(product);
						    product.setOrders(order);
						}

						product.setCategoryId(parseInt(categoryName));
						product.setParentCategoryId(parseLong(categoryName));
						product.setImageUrl(
								"\\uploads\\unavailable.jpg");
						product.setDesignNo(designNo);
						product.setItem(getCellValue(currentRow.getCell(3)));
						product.setGross(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(4)))));
						product.setNet(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(5)))));
						product.setPcs(parseInt(getCellValue(currentRow.getCell(6))));
						product.setDiamondsCt(parseBigDecimal(getCellValue(currentRow.getCell(7))));
						product.setRemarks(getCellValue(currentRow.getCell(8)));
						product.setLabour(parseBigDecimal(getCellValue(currentRow.getCell(9))));
						product.setLabourAll(parseBigDecimal(getCellValue(currentRow.getCell(10))));
						product.setLabourP(parseBigDecimal(getCellValue(currentRow.getCell(11))));
						product.setKarat(parseBigDecimal(getCellValue(currentRow.getCell(12))));
						product.setSubCategoryId(getIdForName(getCellValue(currentRow.getCell(13))));
						String qrUrl = baseUrl + "/loadProductByDesignNo/" + product.getDesignNo();
						// 2. Define save location
						Files.createDirectories(Paths.get(qrDir));
						String qrFileName = "QR_" + product.getDesignNo() + ".png";
						String qrFilePath = qrDir + qrFileName;

						// 3. Generate QR
						generateQRCodeImage(qrUrl, qrFilePath);
						
						String qr_path="/uploads/qr_codes/" + qrFileName;
						// 4. Save QR path in product
						product.setQrCodePath(qr_path);

						products.add(product);
					} catch (Exception e) {
						System.err.println("Error parsing row number " + rowNumber + ": " + e.getMessage());
						e.printStackTrace(); // Log stack trace for debugging
					}

					rowNumber++;
				}

			}

			if (category.equals("Open Setting")) {
				while (rows.hasNext()) {
					System.out.println("inside rows open setting");
					Row currentRow = rows.next();

					// Skip the header row
					if (rowNumber == 0) {
						rowNumber++;
						continue;
					}
					
					if (isRowEmptyByIndexCell(currentRow)) {
			            System.out.println("Stopping at row " + rowNumber + " because index cell (0) is empty");
			            break;
			        }
					

					try {
						Product product = new Product();
						String designNo = dataFormatter.formatCellValue(currentRow.getCell(1));


						// Check if the designNo is unique
						if (designNo != null && !designNo.trim().isEmpty()) {
							while (productRepository.existsByDesignNo(designNo)) { // Add method to check uniqueness
								designNo = generateRandomDesignNo();
							}
						} else {
							// Generate a random design number if none is provided
							designNo = generateRandomDesignNo();
						}
						String orderId = getCellValue(currentRow.getCell(2));
						Optional<Orders> orderOpt = orderRepository.findByOrderId(orderId);
						Orders order;
						if (orderOpt.isPresent()) {
						    Orders existingOrder = orderOpt.get();
						    
						    if (existingOrder.isAssigned()) {
						        // Existing order is already assigned, generate a new unique one
						        String newOrderId = generateUniqueOrderIdForCategory(2);
						        
						        order = new Orders();
						        order.setOrderId(newOrderId);
						        order.setCategoryId(2);
						        order.setAssigned(true);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						       
						    } else {
						        // Existing order is not assigned, reuse it
						        order = existingOrder;
						        order.setAssigned(true);
						        order.setCategoryId(2);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						        
						    }
						} else {
						    // Create a fresh order with the provided ID
						    order = new Orders();
						    order.setOrderId(orderId);
						    order.setCategoryId(2);
						    order.setAssigned(true);
						    order.setAssignedProduct(product);
						    product.setOrders(order);
						}

						
						product.setDesignNo(designNo);
						product.setImageUrl(
								"\\uploads\\unavailable.jpg");
						product.setCategoryId(parseInt(categoryName));
						product.setParentCategoryId(parseLong(categoryName));
						product.setItem(getCellValue(currentRow.getCell(3)));
						product.setGross(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(4)))));
						product.setNet(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(5)))));
						product.setVilandiCt(parseBigDecimal(getCellValue(currentRow.getCell(6))));
						product.setDiamondsCt(parseBigDecimal(getCellValue(currentRow.getCell(7))));
						product.setBeadsCt(parseBigDecimal(getCellValue(currentRow.getCell(8))));
						product.setPearlsGm(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(9)))));
						product.setSsPearlCt(parseBigDecimal(getCellValue(currentRow.getCell(10))));
						product.setOtherStonesCt(parseBigDecimal(getCellValue(currentRow.getCell(11))));
						product.setRemarks(getCellValue(currentRow.getCell(12)));
						product.setLabour(parseBigDecimal(getCellValue(currentRow.getCell(13))));
						product.setLabourAll(parseBigDecimal(getCellValue(currentRow.getCell(14))));
						product.setLabourP(parseBigDecimal(getCellValue(currentRow.getCell(15))));
						product.setKarat(parseBigDecimal(getCellValue(currentRow.getCell(16))));
						product.setSubCategoryId(getIdForName(getCellValue(currentRow.getCell(17))));

						String qrUrl = baseUrl + "/loadProductByDesignNo/" + product.getDesignNo();
						// 2. Define save location
						Files.createDirectories(Paths.get(qrDir));
						String qrFileName = "QR_" + product.getDesignNo() + ".png";
						String qrFilePath = qrDir + qrFileName;

						// 3. Generate QR
						generateQRCodeImage(qrUrl, qrFilePath);
						
						String qr_path="/uploads/qr_codes/" + qrFileName;
						// 4. Save QR path in product
						product.setQrCodePath(qr_path);

						
						products.add(product);

					} catch (Exception e) {
						System.err.println("Error parsing row number " + rowNumber + ": " + e.getMessage());
						e.printStackTrace(); // Log stack trace for debugging
					}

					rowNumber++;
				}

			}

			if (category.equals("Plain Gold")) {
				while (rows.hasNext()) {
					System.out.println("inside rows plain gold");
					Row currentRow = rows.next();

					// Skip the header row
					if (rowNumber == 0) {
						rowNumber++;
						continue;
					}
					
					if (isRowEmptyByIndexCell(currentRow)) {
			            System.out.println("Stopping at row " + rowNumber + " because index cell (0) is empty");
			            break;
			        }
					

					try {
						Product product = new Product();
						String designNo = dataFormatter.formatCellValue(currentRow.getCell(1));


						// Check if the designNo is unique
						if (designNo != null && !designNo.trim().isEmpty()) {
							while (productRepository.existsByDesignNo(designNo)) { // Add method to check uniqueness
								designNo = generateRandomDesignNo();
							}
						} else {
							// Generate a random design number if none is provided
							designNo = generateRandomDesignNo();
						}
						String orderId = getCellValue(currentRow.getCell(2));
						Optional<Orders> orderOpt = orderRepository.findByOrderId(orderId);
						Orders order;
						if (orderOpt.isPresent()) {
						    Orders existingOrder = orderOpt.get();
						    
						    if (existingOrder.isAssigned()) {
						        // Existing order is already assigned, generate a new unique one
						        String newOrderId = generateUniqueOrderIdForCategory(3);
						        
						        order = new Orders();
						        order.setOrderId(newOrderId);
						        order.setCategoryId(3);
						        order.setAssigned(true);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						       
						    } else {
						        // Existing order is not assigned, reuse it
						        order = existingOrder;
						        order.setAssigned(true);
						        order.setCategoryId(3);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						        
						    }
						} else {
						    // Create a fresh order with the provided ID
						    order = new Orders();
						    order.setOrderId(orderId);
						    order.setCategoryId(3);
						    order.setAssigned(true);
						    order.setAssignedProduct(product);
						    product.setOrders(order);
						}

						product.setDesignNo(designNo);
						product.setImageUrl(
								"\\uploads\\unavailable.jpg");
						product.setCategoryId(parseInt(categoryName));
						product.setParentCategoryId(parseLong(categoryName));
						product.setItem(getCellValue(currentRow.getCell(3)));
						product.setGross(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(4)))));
						product.setNet(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(5)))));
						product.setLabour(parseBigDecimal(getCellValue(currentRow.getCell(6))));
						product.setLabourAll(parseBigDecimal(getCellValue(currentRow.getCell(7))));
						product.setLabourP(parseBigDecimal(getCellValue(currentRow.getCell(8))));
						product.setKarat(parseBigDecimal(getCellValue(currentRow.getCell(9))));
						product.setRemarks(getCellValue(currentRow.getCell(10)));
						product.setSubCategoryId(getIdForName(getCellValue(currentRow.getCell(11))));
						String qrUrl = baseUrl + "/loadProductByDesignNo/" + product.getDesignNo();
						// 2. Define save location
						Files.createDirectories(Paths.get(qrDir));
						String qrFileName = "QR_" + product.getDesignNo() + ".png";
						String qrFilePath = qrDir + qrFileName;

						// 3. Generate QR
						generateQRCodeImage(qrUrl, qrFilePath);
						
						String qr_path="/uploads/qr_codes/" + qrFileName;
						// 4. Save QR path in product
						product.setQrCodePath(qr_path);

						products.add(product);
					} catch (Exception e) {
						System.err.println("Error parsing row number " + rowNumber + ": " + e.getMessage());
						e.printStackTrace(); // Log stack trace for debugging
					}

					rowNumber++;
				}

			}

			if (category.equals("Vilandi")) {
				while (rows.hasNext()) {
					System.out.println("inside rows vilandi");
					Row currentRow = rows.next();

					// Skip the header row
					if (rowNumber == 0) {
						rowNumber++;
						continue;
					}

					if (isRowEmptyByIndexCell(currentRow)) {
			            System.out.println("Stopping at row " + rowNumber + " because index cell (0) is empty");
			            break;
			        }
					
					try {
						Product product = new Product();
						// product.setId(parseLong(getCellValue(currentRow.getCell(0)))); // Uncomment
						// if needed
						String designNo = dataFormatter.formatCellValue(currentRow.getCell(1));


						// Check if the designNo is unique
						if (designNo != null && !designNo.trim().isEmpty()) {
							while (productRepository.existsByDesignNo(designNo)) {

								designNo = generateRandomDesignNo();

							}
						} else {
							// Generate a random design number if none is provided
						
							designNo = generateRandomDesignNo();
						}
						String orderId = getCellValue(currentRow.getCell(2));
						Optional<Orders> orderOpt = orderRepository.findByOrderId(orderId);
						Orders order;
						if (orderOpt.isPresent()) {
						    Orders existingOrder = orderOpt.get();
						    
						    if (existingOrder.isAssigned()) {
						        // Existing order is already assigned, generate a new unique one
						        String newOrderId = generateUniqueOrderIdForCategory(5);
						        
						        order = new Orders();
						        order.setOrderId(newOrderId);
						        order.setCategoryId(5);
						        order.setAssigned(true);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						       
						    } else {
						        // Existing order is not assigned, reuse it
						        order = existingOrder;
						        order.setAssigned(true);
						        order.setCategoryId(5);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						        
						    }
						} else {
						    // Create a fresh order with the provided ID
						    order = new Orders();
						    order.setOrderId(orderId);
						    order.setCategoryId(5);
						    order.setAssigned(true);
						    order.setAssignedProduct(product);
						    product.setOrders(order);
						}
						product.setDesignNo(designNo);
						product.setImageUrl(
								"\\uploads\\unavailable.jpg");
						product.setCategoryId(parseInt(categoryName));
						product.setParentCategoryId(parseLong(categoryName));
						product.setItem(getCellValue(currentRow.getCell(3)));
						product.setVilandiCt(parseBigDecimal(getCellValue(currentRow.getCell(4))));
						product.setvRate(parseBigDecimal(getCellValue(currentRow.getCell(5))));
						product.setGross(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(6)))));
						product.setNet(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(7)))));
						product.setStones(parseBigDecimal(getCellValue(currentRow.getCell(8))));
						product.setBeadsCt(parseBigDecimal(getCellValue(currentRow.getCell(9))));
						product.setBdRate(parseBigDecimal(getCellValue(currentRow.getCell(10))));
						product.setPearlsGm(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(11)))));
						product.setPrlRate(parseBigDecimal(getCellValue(currentRow.getCell(12))));
						product.setSsPearlCt(parseBigDecimal(getCellValue(currentRow.getCell(13))));
						product.setSsRate(parseBigDecimal(getCellValue(currentRow.getCell(14))));
						product.setRealStone(parseBigDecimal(getCellValue(currentRow.getCell(15))));
						product.setFitting(parseBigDecimal(getCellValue(currentRow.getCell(16))));
						product.setMozonite(parseBigDecimal(getCellValue(currentRow.getCell(17))));
						product.setmRate(parseBigDecimal(getCellValue(currentRow.getCell(18))));
						product.setLabour(parseBigDecimal(getCellValue(currentRow.getCell(19))));
						product.setLabourAll(parseBigDecimal(getCellValue(currentRow.getCell(20))));
						product.setLabourP(parseBigDecimal(getCellValue(currentRow.getCell(21))));
						product.setKarat(parseBigDecimal(getCellValue(currentRow.getCell(22))));
						product.setRemarks(getCellValue(currentRow.getCell(23)));
						product.setSubCategoryId(getIdForName(getCellValue(currentRow.getCell(24))));
						String qrUrl = baseUrl + "/loadProductByDesignNo/" + product.getDesignNo();

						Files.createDirectories(Paths.get(qrDir));
						String qrFileName = "QR_" + product.getDesignNo() + ".png";
						String qrFilePath = qrDir + qrFileName;

						// 3. Generate QR
						generateQRCodeImage(qrUrl, qrFilePath);
						
						String qr_path="/uploads/qr_codes/" + qrFileName;
						// 4. Save QR path in product
						product.setQrCodePath(qr_path);

						products.add(product);
					} catch (Exception e) {
						System.err.println("Error parsing row number " + rowNumber + ": " + e.getMessage());
						e.printStackTrace(); // Log stack trace for debugging
					}

					rowNumber++;
				}

			}

			if (category.equals("Jadtar")) {
				while (rows.hasNext()) {
					System.out.println("inside rows jadtar");
					Row currentRow = rows.next();

					// Skip the header row
					if (rowNumber == 0) {
						rowNumber++;
						continue;
					}

					if (isRowEmptyByIndexCell(currentRow)) {
			            System.out.println("Stopping at row " + rowNumber + " because index cell (0) is empty");
			            break;
			        }
					
					try {
						Product product = new Product();
						// product.setId(parseLong(getCellValue(currentRow.getCell(0)))); // Uncomment
						// if needed
						String designNo = dataFormatter.formatCellValue(currentRow.getCell(1));


						// Check if the designNo is unique
						if (designNo != null && !designNo.trim().isEmpty()) {
							while (productRepository.existsByDesignNo(designNo)) { // Add method to check uniqueness
								designNo = generateRandomDesignNo();
							}
						} else {
							// Generate a random design number if none is provided
							designNo = generateRandomDesignNo();
						}
						String orderId = getCellValue(currentRow.getCell(2));
						System.out.println("outside order id is "+orderId);
						Optional<Orders> orderOpt = orderRepository.findByOrderId(orderId);
						Orders order;
						if (orderOpt.isPresent()) {
						    Orders existingOrder = orderOpt.get();
						    
						    if (existingOrder.isAssigned()) {
						        // Existing order is already assigned, generate a new unique one
						        String newOrderId = generateUniqueOrderIdForCategory(6);
						        
						        order = new Orders();
						        System.out.println("new order id is "+orderId);
						        order.setOrderId(newOrderId);
						        order.setCategoryId(6);
						        order.setAssigned(true);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						       
						    } else {
						    	System.out.println("already existing not assigned order id is "+orderId);
						        // Existing order is not assigned, reuse it
						        order = existingOrder;
						        order.setAssigned(true);
						        order.setCategoryId(6);
						        order.setAssignedProduct(product);
						        product.setOrders(order);
						        
						    }
						} else {
						    // Create a fresh order with the provided ID
							System.out.println("freshly created order id is "+orderId);
						    order = new Orders();
						    order.setOrderId(orderId);
						    order.setCategoryId(6);
						    order.setAssigned(true);
						    order.setAssignedProduct(product);
						    product.setOrders(order);
						}
						product.setDesignNo(designNo);
						product.setImageUrl(
								"\\uploads\\unavailable.jpg");
						product.setCategoryId(parseInt(categoryName));
						product.setParentCategoryId(parseLong(categoryName));
						product.setItem(getCellValue(currentRow.getCell(3)));
						product.setGross(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(4)))));
						product.setNet(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(5)))));
						product.setStones(parseBigDecimal(getCellValue(currentRow.getCell(6))));
						product.setStRate(parseBigDecimal(getCellValue(currentRow.getCell(7))));
						product.setBeadsCt(parseBigDecimal(getCellValue(currentRow.getCell(8))));
						product.setBdRate(parseBigDecimal(getCellValue(currentRow.getCell(9))));
						product.setPearlsGm(scaleTo3(parseBigDecimal(getCellValue(currentRow.getCell(10)))));
						product.setPrlRate(parseBigDecimal(getCellValue(currentRow.getCell(11))));
						product.setSsPearlCt(parseBigDecimal(getCellValue(currentRow.getCell(12))));
						product.setSsRate(parseBigDecimal(getCellValue(currentRow.getCell(13))));
						product.setRealStone(parseBigDecimal(getCellValue(currentRow.getCell(14))));
						product.setFitting(parseBigDecimal(getCellValue(currentRow.getCell(15))));
						product.setMozonite(parseBigDecimal(getCellValue(currentRow.getCell(16))));
						product.setmRate(parseBigDecimal(getCellValue(currentRow.getCell(17))));
						product.setLabour(parseBigDecimal(getCellValue(currentRow.getCell(18))));
						product.setLabourAll(parseBigDecimal(getCellValue(currentRow.getCell(19))));
						product.setLabourP(parseBigDecimal(getCellValue(currentRow.getCell(20))));
						product.setKarat(parseBigDecimal(getCellValue(currentRow.getCell(21))));
						product.setRemarks(getCellValue(currentRow.getCell(22)));
						product.setSubCategoryId(getIdForName(getCellValue(currentRow.getCell(23))));
						String qrUrl = baseUrl + "/loadProductByDesignNo/" + product.getDesignNo();
						Files.createDirectories(Paths.get(qrDir));
						String qrFileName = "QR_" + product.getDesignNo() + ".png";
						String qrFilePath = qrDir + qrFileName;

						// 3. Generate QR
						generateQRCodeImage(qrUrl, qrFilePath);
						
						String qr_path="/uploads/qr_codes/" + qrFileName;
						// 4. Save QR path in product
						product.setQrCodePath(qr_path);

						products.add(product);
					} catch (Exception e) {
						System.err.println("Error parsing row number " + rowNumber + ": " + e.getMessage());
						e.printStackTrace(); // Log stack trace for debugging
					}

					rowNumber++;
				}

			}
			saveProducts(products);
			// productRepository.saveAll(products);

		} catch (Exception e) {
			System.err.println("Exception occurred while processing Excel file: " + e.getMessage());
			e.printStackTrace(); // Log stack trace for debugging
			throw new Exception("Error while processing the Excel file: " + e.getMessage());
		} finally {
			if (workbook != null) {
				workbook.close();
			}
		}
	}
	
	private BigDecimal scaleTo3(BigDecimal value) {
	    return value == null ? null : value.setScale(3, RoundingMode.HALF_UP);
	}

	
	private boolean isRowEmptyByIndexCell(Row row) {
	    if (row == null) return true;
	    String indexVal = getCellValue(row.getCell(0));  // column 0
	    return indexVal == null || indexVal.trim().isEmpty();
	}


	public Page<Product> searchWithoutCategory(
	        String searchTerm,
	        String searchBy,
			boolean verifiedOnly,
	        Pageable pageable
	) {
	    String mode = (searchBy == null ? "name" : searchBy).toLowerCase();
	    String term = searchTerm == null ? "" : searchTerm;

	    return switch (mode) {

	               case "design" ->
            verifiedOnly
                ? productRepository
                    .findByDesignNoContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, 1, "", pageable)
                : productRepository
                    .findByDesignNoContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                        term, "", pageable);

        case "name" ->
            verifiedOnly
                ? productRepository
                    .findByItemContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, 1, "", pageable)
                : productRepository
                    .findByItemContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                        term, "", pageable);

        case "all" ->
            verifiedOnly
                ? productRepository
                    .findByItemContainingIgnoreCaseOrDesignNoContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, term, 1, "", pageable)
                : productRepository
                    .findByItemContainingIgnoreCaseOrDesignNoContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                        term, term, "", pageable);

        case "order" ->
            verifiedOnly
                ? productRepository
                    .findByOrders_OrderIdContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, 1, "", pageable)
                : productRepository
                    .findByOrders_OrderIdContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                        term, "", pageable);

        default ->
            verifiedOnly
                ? productRepository
                    .findByItemContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, 1, "", pageable)
                : productRepository
                    .findByItemContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                        term, "", pageable);
	    };
	}

	public Page<Product> searchByCategory(
	        List<Integer> categories,
	        String searchTerm,
	        String searchBy,
			boolean verifiedOnly,
	        Pageable pageable
	) {
	    String mode = (searchBy == null ? "name" : searchBy).toLowerCase(Locale.ROOT);
	    String term = (searchTerm == null) ? "" : searchTerm.trim();

	    boolean isSubCategory =
	            categories.size() == 1 && subCategoryExists(categories.get(0));

	    /* ================= SUB CATEGORY ================= */
	    if (isSubCategory) {

	        Long subCatId = categories.get(0).longValue();

      switch (mode) {

            case "designno":
                return verifiedOnly
                    ? productRepository
                        .findBySubCategoryIdAndDesignNoContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, 1, "", pageable)
                    : productRepository
                        .findBySubCategoryIdAndDesignNoContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, "", pageable);

            case "design":
                if (!term.matches("\\d+")) {
                    return Page.empty(pageable);
                }
                return verifiedOnly
                    ? productRepository
                        .findByDesignNoAndVerificationStatus(Long.valueOf(term), 1, pageable)
                    : productRepository
                        .findByDesignNo(Long.valueOf(term), pageable);

            case "all":
                if (term.isBlank()) {
                    return verifiedOnly
                        ? productRepository
                            .findBySubCategoryIdAndItemContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                                subCatId, "", 1, "", pageable)
                        : productRepository
                            .findBySubCategoryIdAndItemContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                                subCatId, "", "", pageable);
                }

                if (term.matches("\\d+")) {
                    return verifiedOnly
                        ? productRepository
                            .searchByNameOrDesignAndVerificationStatus(term, Long.valueOf(term), 1, pageable)
                        : productRepository
                            .searchByNameOrDesign(term, Long.valueOf(term), pageable);
                }

                return verifiedOnly
                    ? productRepository
                        .findBySubCategoryIdAndItemContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, 1, "", pageable)
                    : productRepository
                        .findBySubCategoryIdAndItemContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, "", pageable);

            case "order":
                return verifiedOnly
                    ? productRepository
                        .findByOrders_OrderIdContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                            term, categories, 1, "", pageable)
                    : productRepository
                        .findByOrders_OrderIdContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                            term, categories, "", pageable);

            case "name":
            default:
                return verifiedOnly
                    ? productRepository
                        .findBySubCategoryIdAndItemContainingIgnoreCaseAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, 1, "", pageable)
                    : productRepository
                        .findBySubCategoryIdAndItemContainingIgnoreCaseAndDesignNoIsNotNullAndDesignNoNot(
                            subCatId, term, "", pageable);
        }
    }

	      /* ================= CATEGORY ================= */
    switch (mode) {

        case "designno":
            return verifiedOnly
                ? productRepository
                    .findByDesignNoContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, 1, "", pageable)
                : productRepository
                    .findByDesignNoContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, "", pageable);

        case "design":
            if (!term.matches("\\d+")) {
                return Page.empty(pageable);
            }
            return verifiedOnly
                ? productRepository
                    .findByDesignNoAndVerificationStatus(Long.valueOf(term), 1, pageable)
                : productRepository
                    .findByDesignNo(Long.valueOf(term), pageable);

        case "order":
            return verifiedOnly
                ? productRepository
                    .findByOrders_OrderIdContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, 1, "", pageable)
                : productRepository
                    .findByOrders_OrderIdContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, "", pageable);

        case "all":
            if (term.isBlank()) {
                return verifiedOnly
                    ? productRepository
                        .findByItemContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                            "", categories, 1, "", pageable)
                    : productRepository
                        .findByItemContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                            "", categories, "", pageable);
            }

            if (term.matches("\\d+")) {
                return verifiedOnly
                    ? productRepository
                        .searchByNameOrDesignAndVerificationStatus(term, Long.valueOf(term), 1, pageable)
                    : productRepository
                        .searchByNameOrDesign(term, Long.valueOf(term), pageable);
            }

            return verifiedOnly
                ? productRepository
                    .findByItemContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, 1, "", pageable)
                : productRepository
                    .findByItemContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, "", pageable);

        case "name":
        default:
            return verifiedOnly
                ? productRepository
                    .findByItemContainingIgnoreCaseAndCategoryIdInAndVerificationStatusAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, 1, "", pageable)
                : productRepository
                    .findByItemContainingIgnoreCaseAndCategoryIdInAndDesignNoIsNotNullAndDesignNoNot(
                        term, categories, "", pageable);
    }
	}
    public List<Product> getAllProductsByCategory(Long categoryId, Long subCategoryId) {
        List<Product> products;
        if (subCategoryId == null) {
            products = productRepository. findByCategoryIdAndOrdersIsNotNullAndDesignNoIsNotNull(categoryId);
        } else {
            products = productRepository.findByCategoryIdAndSubCategoryIdAndOrdersIsNotNullAndDesignNoIsNotNull(categoryId, subCategoryId);
        }
        return products.stream()
                       .filter(p -> p.getDesignNo() != null && !p.getDesignNo().isEmpty())
                       .collect(Collectors.toList());
    }


    @Transactional
    public Product updateVerificationByDesignNo(String designNo, int status) {
        Product p = productRepository.findByDesignNo(designNo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        p.setVerificationStatus(status);
        p.setVerificationDate(LocalDateTime.now()); // server-side authoritative timestamp
        return productRepository.save(p);
    }
    
    private static final Set<Integer> subCategoryIds = Set.of(
    	    6,7,8,9,10,11,12,13,14,15,16,17,18,19,20
    	);

    	private boolean subCategoryExists(int id) {
    	    return subCategoryIds.contains(id);
    	}

    
	public static String generateQRCodeImage(String text, String filePath) 
	        throws WriterException, IOException {

	    QRCodeWriter qrCodeWriter = new QRCodeWriter();

	    Map<EncodeHintType, Object> hints = new HashMap<>();
	    hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.Q);
	    hints.put(EncodeHintType.MARGIN, 1);

	    // Generate higher resolution (300x300 px)
	    BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, 300, 300, hints);

	    Path path = FileSystems.getDefault().getPath(filePath);
	    MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);

	    return filePath;
	}

	public int regenerateAllQRCodes(String customBaseUrl) {
		String activeBaseUrl = (customBaseUrl != null && !customBaseUrl.isBlank()) ? customBaseUrl.trim() : this.baseUrl;
		if (activeBaseUrl.endsWith("/")) {
			activeBaseUrl = activeBaseUrl.substring(0, activeBaseUrl.length() - 1);
		}

		List<Product> products = productRepository.findAll();
		int count = 0;
		for (Product product : products) {
			try {
				if (product.getDesignNo() == null || product.getDesignNo().trim().isEmpty()) {
					continue;
				}
				// 1. Create QR URL
				String qrUrl = activeBaseUrl + "/loadProductByDesignNo/" + product.getDesignNo();

				// 2. Ensure folder exists
				Files.createDirectories(Paths.get(qrDir));
				String qrFileName = "QR_" + product.getDesignNo() + ".png";
				String qrFilePath = qrDir + (qrDir.endsWith("/") || qrDir.endsWith("\\") ? "" : "/") + qrFileName;

				// 3. Generate QR image file
				generateQRCodeImage(qrUrl, qrFilePath);

				// 4. Set public path
				String qrPath = qrPublicPath + qrFileName;
				product.setQrCodePath(qrPath);
				count++;
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		productRepository.saveAll(products);
		return count;
	}


	public void saveProducts(List<Product> products) {
		Set<String> uniqueDesignNos = new HashSet<>();

		for (Product product : products) {
			String designNo = product.getDesignNo();

			// If designNo already exists, generate a new unique one
			while (uniqueDesignNos.contains(designNo)) {
				designNo = generateRandomDesignNo();
				product.setDesignNo(designNo);
			}

			// Add the designNo to the set to track it
			uniqueDesignNos.add(designNo);
		}

		// Save updated product list
		productRepository.saveAll(products);
	}

	private String getCellValue(Cell cell) {
		if (cell == null) {
			return null;
		}
		switch (cell.getCellType()) {
		case STRING:
			return cell.getStringCellValue();
		case NUMERIC:
			return String.valueOf(cell.getNumericCellValue());
		case BOOLEAN:
			return String.valueOf(cell.getBooleanCellValue());
		default:
			return null;
		}
	}

	private Double parseDouble(String value) {
		try {
			return value != null ? Double.parseDouble(value) : null;
		} catch (NumberFormatException e) {
			return null;
		}
	}

	private Integer parseInt(String value) {
	    try {
	        if (value != null) {
	            Double d = Double.parseDouble(value);
	            return d.intValue(); // will convert 24.0 → 24
	        }
	    } catch (NumberFormatException e) {
	        return null;
	    }
	    return null;
	}


	private Long parseLong(String value) {
	    try {
	        if (value != null) {
	            Double d = Double.parseDouble(value);
	            return d.longValue(); // 24.0 → 24
	        }
	    } catch (NumberFormatException e) {
	        return null;
	    }
	    return null;
	}

	private BigDecimal parseBigDecimal(String value) {
		try {
			return value == null || value.trim().isEmpty() ? null : new BigDecimal(value);
		} catch (NumberFormatException e) {
			throw new IllegalArgumentException("Invalid numeric value: " + value);
		}
	}

	private String generateRandomDesignNo() {
	    int num = (int)(Math.random() * 10_000); // 0 to 9999
	    return "DES-" + String.format("%04d", num);
	}

	
	public List<Orders> findByCategoryIdAndIsAssignedFalse(Long categoryId){
		
		return orderRepository.findByCategoryIdAndIsAssignedFalse(categoryId);
	}
	
	
	// Multiple categories (NEW)
	public List<Orders> findByCategoryIdsAndIsAssignedFalse(List<Integer> categoryIds){
		return orderRepository.findByCategoryIdsAndIsAssignedFalse(categoryIds);
	}

	// All unassigned
	public List<Orders> findAllByIsAssignedFalse(){
		return orderRepository.findAllByIsAssignedFalse();
	}
	
	public String generateUniqueOrderIdForCategory(Integer categoryId) {
	    String prefix = "";

	    switch (categoryId) {
	        case 1: prefix = "dia"; break;
	        case 2: prefix = "ope"; break;
	        case 3: prefix = "cha"; break;
	        case 4: prefix = "ear"; break;
	        case 5: prefix = "vil"; break;
	        case 6: prefix = "jad"; break;
	        default: prefix = "ord"; break;
	    }

	    String newOrderId;
	    do {
	        int randomNum = (int)(Math.random() * 10000); // adjust range if needed
	        newOrderId = prefix + randomNum;
	    } while (orderRepository.existsByOrderId(newOrderId));

	    return newOrderId;
	}

	@Transactional
	public int applyBatchUpdate(Long categoryId, Map<String, String> updates) {
		if (categoryId == null) {
			throw new IllegalArgumentException("Category ID is required");
		}
		if (updates == null || updates.isEmpty()) {
			throw new IllegalArgumentException("No updates provided");
		}

		List<Product> products = productRepository.findByCategoryIdAndOrdersIsNotNullAndDesignNoIsNotNull(categoryId);
		if (products.isEmpty()) {
			return 0;
		}

		for (Product product : products) {
			BatchUpdateMapper.applyUpdates(product, updates);
		}

		productRepository.saveAll(products);
		return products.size();
	}

	public List<RateHistory> getRateHistory(String commodity, LocalDateTime start, LocalDateTime end) {
		if (start != null && end != null) {
			return rateHistoryRepository
					.findByCommodityAndUpdatedAtBetweenOrderByUpdatedAtDesc(commodity, start, end);
		}
		return rateHistoryRepository.findByCommodityOrderByUpdatedAtDesc(commodity);
	}
}