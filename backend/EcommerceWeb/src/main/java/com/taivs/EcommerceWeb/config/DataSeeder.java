package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.config.integration.ImageKitProperties;
import com.taivs.EcommerceWeb.constants.PredefinedRole;
import com.taivs.EcommerceWeb.enums.order.OrderStatus;
import com.taivs.EcommerceWeb.enums.promotion.CouponType;
import com.taivs.EcommerceWeb.enums.promotion.DiscountType;
import com.taivs.EcommerceWeb.models.admin.SearchHistory;
import com.taivs.EcommerceWeb.models.auth.Permission;
import com.taivs.EcommerceWeb.models.auth.Role;
import com.taivs.EcommerceWeb.models.auth.RolePermission;
import com.taivs.EcommerceWeb.models.auth.UserRole;
import com.taivs.EcommerceWeb.models.auth.UserRoleId;
import com.taivs.EcommerceWeb.models.cart.CartItem;
import com.taivs.EcommerceWeb.models.order.Order;
import com.taivs.EcommerceWeb.models.order.OrderItem;
import com.taivs.EcommerceWeb.models.order.OrderShopGroup;
import com.taivs.EcommerceWeb.models.order.ShippingAddress;
import com.taivs.EcommerceWeb.models.product.*;
import com.taivs.EcommerceWeb.models.promotion.Coupon;
import com.taivs.EcommerceWeb.models.promotion.UserCoupon;
import com.taivs.EcommerceWeb.models.shop.Shop;
import com.taivs.EcommerceWeb.models.shop.ShopAddress;
import com.taivs.EcommerceWeb.models.shop.ShopFollower;
import com.taivs.EcommerceWeb.models.user.User;
import com.taivs.EcommerceWeb.models.user.UserAddress;
import com.taivs.EcommerceWeb.models.warehouse.Warehouse;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseEmployee;
import com.taivs.EcommerceWeb.models.warehouse.WarehouseStock;
import com.taivs.EcommerceWeb.repositories.admin.SearchHistoryRepository;
import com.taivs.EcommerceWeb.repositories.auth.PermissionRepository;
import com.taivs.EcommerceWeb.repositories.auth.RolePermissionRepository;
import com.taivs.EcommerceWeb.repositories.auth.RoleRepository;
import com.taivs.EcommerceWeb.repositories.auth.UserRoleRepository;
import com.taivs.EcommerceWeb.repositories.cart.CartItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderItemRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderRepository;
import com.taivs.EcommerceWeb.repositories.order.OrderShopGroupRepository;
import com.taivs.EcommerceWeb.models.product.ProductVariantImage;
import com.taivs.EcommerceWeb.repositories.product.*;
import com.taivs.EcommerceWeb.repositories.promotion.CouponRepository;
import com.taivs.EcommerceWeb.repositories.promotion.UserCouponRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopFollowerRepository;
import com.taivs.EcommerceWeb.repositories.shop.ShopRepository;
import com.taivs.EcommerceWeb.repositories.user.UserAddressRepository;
import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseEmployeeRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseRepository;
import com.taivs.EcommerceWeb.repositories.warehouse.WarehouseStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.datafaker.Faker;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Data seeder activated with Spring profile "seed".
 * Uploads images to ImageKit. Creates proper EAV product data.
 * Idempotent — skips if data already exists.
 */
@Component
@Profile("seed")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserAddressRepository userAddressRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductAttributeRepository productAttributeRepository;
    private final DetailAttributeRepository detailAttributeRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductVariantImageRepository productVariantImageRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;
    private final CouponRepository couponRepository;
    private final CustomerReviewRepository customerReviewRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistRepository wishlistRepository;
    private final ShopFollowerRepository shopFollowerRepository;
    private final UserCouponRepository userCouponRepository;
    private final OrderRepository orderRepository;
    private final OrderShopGroupRepository orderShopGroupRepository;
    private final OrderItemRepository orderItemRepository;
    private final WarehouseEmployeeRepository warehouseEmployeeRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageKitProperties imageKitProperties;

    private final Faker faker = new Faker(new Locale("vi"));
    private final Random random = new Random(42);
    private final RestTemplate restTemplate = new RestTemplate();
    private final Map<String, String> uploadedCache = new ConcurrentHashMap<>();

    private static final int NUM_BUYERS = 50;
    private static final int NUM_SELLERS = 8;
    private static final int PRODUCTS_PER_SHOP = 15;
    private static final int REVIEWS_PER_PRODUCT = 12;
    private static final String DEFAULT_PASSWORD = "Password1!";

    // ── Product blueprints ───────────────────────────────────
    private record Blueprint(String category, String[] products,
                             String[] attrNames, String[][] attrOptions,
                             long[] basePrices, int wt, int ln, int wd, int ht,
                             String imgSeed) {}

    private static final List<Blueprint> BPS = List.of(
        new Blueprint("Smartphones",
            new String[]{"iPhone 15 Pro Max","Samsung Galaxy S24 Ultra","Google Pixel 8 Pro","Xiaomi 14 Ultra"},
            new String[]{"Color","Storage"},
            new String[][]{{"Midnight","Silver","Gold"},{"128GB","256GB","512GB"}},
            new long[]{28_990_000,31_990_000,22_990_000,16_990_000}, 800,16,8,1, "phone"),
        new Blueprint("Laptops",
            new String[]{"MacBook Air M3","Dell XPS 15","ThinkPad X1 Carbon Gen 11","ASUS ROG Zephyrus G14"},
            new String[]{"Color","RAM"},
            new String[][]{{"Space Gray","Silver","Starlight"},{"16GB","32GB"}},
            new long[]{27_990_000,35_990_000,32_990_000,39_990_000}, 1800,36,25,2, "laptop"),
        new Blueprint("Headphones",
            new String[]{"AirPods Pro 2","Sony WH-1000XM5","Samsung Galaxy Buds3 Pro","Bose QuietComfort Ultra"},
            new String[]{"Color"},
            new String[][]{{"Black","White","Silver"}},
            new long[]{5_990_000,7_490_000,4_990_000,8_990_000}, 250,8,8,5, "headphone"),
        new Blueprint("Smartwatches",
            new String[]{"Apple Watch Ultra 2","Samsung Galaxy Watch 6","Garmin Venu 3","Xiaomi Watch S3"},
            new String[]{"Color","Size"},
            new String[][]{{"Black","Silver","Orange"},{"41mm","45mm"}},
            new long[]{18_990_000,7_990_000,10_490_000,3_290_000}, 70,5,5,1, "watch"),
        new Blueprint("Tablets",
            new String[]{"iPad Air M2","Samsung Galaxy Tab S9","Xiaomi Pad 6 Pro","Lenovo Tab P12 Pro"},
            new String[]{"Color","Storage"},
            new String[][]{{"Space Gray","Blue","Purple"},{"128GB","256GB"}},
            new long[]{15_990_000,19_990_000,8_990_000,12_990_000}, 500,25,17,1, "tablet"),
        new Blueprint("Speakers",
            new String[]{"JBL Charge 5","Harman Kardon Onyx Studio 8","Marshall Stanmore III","Bose SoundLink Flex"},
            new String[]{"Color"},
            new String[][]{{"Black","Blue","Red","Green"}},
            new long[]{2_890_000,6_990_000,9_990_000,3_290_000}, 900,12,12,10, "speaker"),
        new Blueprint("Gaming Accessories",
            new String[]{"Logitech G Pro X Superlight 2","Razer DeathAdder V3","SteelSeries Arctis Nova Pro","HyperX Cloud III"},
            new String[]{"Color"},
            new String[][]{{"Black","White"}},
            new long[]{3_190_000,2_290_000,6_490_000,2_490_000}, 120,8,5,3, "gaming"),
        new Blueprint("Phone Cases",
            new String[]{"OtterBox Defender Series","Spigen Ultra Hybrid","Casetify Impact Case","UAG Pathfinder"},
            new String[]{"Color","Material"},
            new String[][]{{"Clear","Black","Navy"},{"Silicone","Polycarbonate"}},
            new long[]{490_000,350_000,890_000,690_000}, 50,15,8,1, "case"),
        new Blueprint("Keyboards",
            new String[]{"Keychron K8 Pro","Logitech MX Keys","Corsair K70 RGB","HHKB Professional Hybrid"},
            new String[]{"Switch","Layout"},
            new String[][]{{"Red","Brown","Blue","Silent Red"},{"TKL","Full","65%"}},
            new long[]{1_990_000,2_590_000,3_790_000,6_990_000}, 900,36,12,4, "keyboard"),
        new Blueprint("Monitors",
            new String[]{"LG 27GP850-B","Samsung Odyssey G7","ASUS ROG Swift PG279QM","Dell UltraSharp U2722D"},
            new String[]{"Resolution","Refresh Rate"},
            new String[][]{{"1080p","1440p","4K"},{"144Hz","165Hz","240Hz"}},
            new long[]{5_990_000,8_990_000,14_990_000,12_490_000}, 5000,61,36,22, "monitor"),
        new Blueprint("Cameras",
            new String[]{"Sony ZV-E10","Canon EOS M50 Mark II","Fujifilm X-T5","GoPro Hero 12 Black"},
            new String[]{"Color","Kit"},
            new String[][]{{"Black","White"},{"Body Only","With Lens"}},
            new long[]{12_990_000,15_990_000,32_990_000,10_990_000}, 400,12,8,6, "camera"),
        new Blueprint("Power Banks",
            new String[]{"Anker 737 Power Bank","Baseus 65W Power Bank","Xiaomi 33W Power Bank","UGREEN 25000mAh"},
            new String[]{"Capacity","Color"},
            new String[][]{{"10000mAh","20000mAh","25000mAh"},{"Black","White","Blue"}},
            new long[]{890_000,1_290_000,690_000,1_590_000}, 250,14,7,2, "powerbank"),
        new Blueprint("Mice",
            new String[]{"Logitech MX Master 3S","Razer Basilisk V3 Pro","Apple Magic Mouse","SteelSeries Prime+"},
            new String[]{"Color","Connection"},
            new String[][]{{"Black","White","Blue"},{"Wired","Wireless"}},
            new long[]{1_490_000,2_290_000,1_890_000,1_690_000}, 130,7,4,4, "mouse"),
        new Blueprint("Earbuds",
            new String[]{"Sony WF-1000XM5","Nothing Ear 2","JBL Tune Buds","Samsung Galaxy Buds FE"},
            new String[]{"Color"},
            new String[][]{{"Black","White","Pink","Sage Green"}},
            new long[]{4_990_000,2_890_000,1_590_000,2_190_000}, 55,6,6,3, "earbuds"),
        new Blueprint("Cables & Adapters",
            new String[]{"Anker USB-C to Lightning","Ugreen 240W USB-C Cable","Belkin MagSafe Charger","Apple 20W USB-C Adapter"},
            new String[]{"Length","Color"},
            new String[][]{{"1m","2m","3m"},{"Black","White","Silver"}},
            new long[]{290_000,490_000,890_000,650_000}, 60,200,1,1, "cable"),
        new Blueprint("Smart Home",
            new String[]{"Xiaomi Smart Bulb E27","TP-Link Tapo C210","Philips Hue White","Google Nest Mini Gen2"},
            new String[]{"Color","Pack"},
            new String[][]{{"White","Black","Multicolor"},{"1-Pack","2-Pack","4-Pack"}},
            new long[]{150_000,890_000,1_490_000,1_190_000}, 200,10,10,10, "smarthome"),
        new Blueprint("PC Components",
            new String[]{"Kingston FURY 16GB DDR5","Samsung 990 Pro 1TB NVMe","WD Black SN850X 2TB","Corsair Vengeance 32GB"},
            new String[]{"Capacity","Speed"},
            new String[][]{{"512GB","1TB","2TB"},{"DDR5-6000","DDR5-6400","Gen4 x4"}},
            new long[]{1_890_000,3_290_000,4_590_000,2_790_000}, 100,8,3,1, "pccomp"),
        new Blueprint("Drones",
            new String[]{"DJI Mini 4 Pro","DJI Air 3","Autel EVO Lite+","Holy Stone HS720E"},
            new String[]{"Color","Kit"},
            new String[][]{{"Grey","Alpine White"},{"Standard","Fly More Combo"}},
            new long[]{18_990_000,26_990_000,14_990_000,6_990_000}, 300,18,10,7, "drone"),
        new Blueprint("Portable Chargers",
            new String[]{"Anker Prime 27650mAh","Zendure SuperTank Pro","Baseus Blade 100W","UGREEN Nexode 100W"},
            new String[]{"Capacity"},
            new String[][]{{"10000mAh","20000mAh","27000mAh"}},
            new long[]{1_190_000,2_890_000,4_990_000,890_000}, 300,16,8,2, "charger")
    );

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 2) {
            log.info("[SEED] Data already present — skipping seed.");
            return;
        }

        log.info("[SEED] ╔══════════════════════════════════════╗");
        log.info("[SEED] ║      Starting data seed ...          ║");
        log.info("[SEED] ╚══════════════════════════════════════╝");

        Map<String, Role> roles = ensureRoles();
        createPermissions(roles);

        createUser("admin", "admin@gocart.com", "Admin GoCart", roles.get(PredefinedRole.ADMIN));

        List<User> buyers = new ArrayList<>();
        for (int i = 1; i <= NUM_BUYERS; i++) {
            User buyer = createUser("buyer" + i, "buyer" + i + "@gocart.com",
                    faker.name().fullName(), roles.get(PredefinedRole.USER));
            createAddress(buyer);
            buyers.add(buyer);
        }

        Map<String, Category> categoryMap = createCategories();

        List<Shop> shops = new ArrayList<>();
        List<Warehouse> warehouses = new ArrayList<>();
        List<ProductVariant> allVariants = new ArrayList<>();

        int globalIdx = 0;
        for (int s = 1; s <= NUM_SELLERS; s++) {
            User seller = createUser("seller" + s, "seller" + s + "@gocart.com",
                    faker.name().fullName(), roles.get(PredefinedRole.SELLER));
            createAddress(seller);

            Shop shop = createShop(seller, s);
            Warehouse warehouse = createWarehouse(shop);
            shops.add(shop);
            warehouses.add(warehouse);

            // Assign seller as warehouse manager
            warehouseEmployeeRepository.save(WarehouseEmployee.builder()
                    .warehouse(warehouse).user(seller).role("MANAGER").build());

            for (int p = 0; p < PRODUCTS_PER_SHOP; p++) {
                Blueprint bp = BPS.get(globalIdx % BPS.size());
                Category category = categoryMap.get(bp.category);
                String productName = bp.products[(globalIdx / BPS.size()) % bp.products.length];

                Product product = createProductWithEAV(shop, category, bp, productName, globalIdx);
                List<ProductVariant> variants = new ArrayList<>(product.getVariants());
                createWarehouseStock(warehouse, variants);
                createReviews(product, variants, buyers);
                allVariants.addAll(variants);
                globalIdx++;
            }
        }

        // --- new sections ---
        createCarts(buyers, allVariants);
        createWishlists(buyers, productRepository.findAll());
        createShopFollowers(buyers, shops);
        List<Coupon> coupons = createPlatformCoupons();
        createShopCoupons(shops);
        createUserCoupons(buyers, coupons);
        createOrders(buyers, shops, warehouses, allVariants);
        createSearchHistory(buyers);

        log.info("[SEED] ════════════════════════════════════════");
        log.info("[SEED] ✅ Seed complete!");
        log.info("[SEED]   Users:              {}", userRepository.count());
        log.info("[SEED]   Shops:              {}", shopRepository.count());
        log.info("[SEED]   Products:           {}", productRepository.count());
        log.info("[SEED]   Variants:           {}", productVariantRepository.count());
        log.info("[SEED]   Orders:             {}", orderRepository.count());
        log.info("[SEED]   Cart items:         {}", cartItemRepository.count());
        log.info("[SEED]   Wishlists:          {}", wishlistRepository.count());
        log.info("[SEED]   Shop followers:     {}", shopFollowerRepository.count());
        log.info("[SEED]   Permissions:        {}", permissionRepository.count());
        log.info("[SEED]   Role-permissions:   {}", rolePermissionRepository.count());
        log.info("[SEED] ════════════════════════════════════════");
    }

    // ═══════════════════════════════════════════════════════════
    // ImageKit upload (by URL — no local file needed)
    // ═══════════════════════════════════════════════════════════
    private String uploadToImageKit(String sourceUrl, String fileName, String folder) {
        String cacheKey = folder + "/" + fileName;
        if (uploadedCache.containsKey(cacheKey)) return uploadedCache.get(cacheKey);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBasicAuth(imageKitProperties.getPrivateKey(), "");

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", sourceUrl);
            body.add("fileName", fileName);
            body.add("folder", folder);
            body.add("useUniqueFileName", "true");

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.postForObject(
                    "https://upload.imagekit.io/api/v1/files/upload",
                    new HttpEntity<>(body, headers), Map.class);

            if (resp != null && resp.get("url") != null) {
                String url = String.valueOf(resp.get("url"));
                uploadedCache.put(cacheKey, url);
                log.info("[SEED]   📸 Uploaded: {}", fileName);
                return url;
            }
        } catch (Exception e) {
            log.warn("[SEED]   ⚠️ ImageKit upload failed for {}: {}", fileName, e.getMessage());
        }
        return sourceUrl;
    }

    // ═══════════════════════════════════════════════════════════
    // Roles
    // ═══════════════════════════════════════════════════════════
    private Map<String, Role> ensureRoles() {
        Map<String, Role> map = new HashMap<>();
        for (String name : List.of(PredefinedRole.ADMIN, PredefinedRole.USER,
                PredefinedRole.SELLER, PredefinedRole.WAREHOUSE_EMPLOYEE)) {
            Role role = roleRepository.findByName(name)
                    .orElseGet(() -> roleRepository.save(
                            Role.builder().name(name).description(name + " role").build()));
            map.put(name, role);
        }
        return map;
    }

    // ═══════════════════════════════════════════════════════════
    // Users
    // ═══════════════════════════════════════════════════════════
    private User createUser(String username, String email, String fullName, Role role) {
        User user = userRepository.save(User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .dob(LocalDate.of(1990 + random.nextInt(15), 1 + random.nextInt(12), 1 + random.nextInt(28)))
                .active(true)
                .build());

        userRoleRepository.save(UserRole.builder()
                .id(new UserRoleId(user.getId(), role.getId()))
                .user(user).role(role).build());

        log.info("[SEED]   👤 {} ({})", username, role.getName());
        return user;
    }

    private void createAddress(User user) {
        String[][] locs = {
            {"Hà Nội","Quận Hoàn Kiếm","Phường Tràng Tiền","21012","1442","201"},
            {"TP Hồ Chí Minh","Quận 1","Phường Bến Nghé","20308","1443","202"},
            {"Đà Nẵng","Quận Hải Châu","Phường Thạch Thang","20608","1527","203"},
            {"Hải Phòng","Quận Lê Chân","Phường An Biên","20108","1525","204"},
            {"Cần Thơ","Quận Ninh Kiều","Phường Cái Khế","30608","1588","205"}
        };
        String[] loc = locs[random.nextInt(locs.length)];

        userAddressRepository.save(UserAddress.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .receiverName(user.getFullName())
                .phoneNumber("09" + (10000000 + random.nextInt(90000000)))
                .province(loc[0]).district(loc[1]).ward(loc[2])
                .wardCode(loc[3]).districtId(Integer.parseInt(loc[4])).provinceId(Integer.parseInt(loc[5]))
                .fullAddress(loc[2] + ", " + loc[1] + ", " + loc[0])
                .detailAddress(faker.address().streetAddress())
                .defaultAddress(true)
                .build());
    }

    // ═══════════════════════════════════════════════════════════
    // Shops
    // ═══════════════════════════════════════════════════════════
    private Shop createShop(User seller, int idx) {
        String[][] shopData = {
            {"TechZone Official","Your go-to destination for cutting-edge technology."},
            {"GadgetHub Store","Premium gadgets and electronics at unbeatable prices."},
            {"DigiMart Express","Fast shipping on all digital products and accessories."},
            {"SmartDeals VN","Best deals on smartphones, laptops, and more."},
            {"EliteGadgets VN","Premium electronics curated for enthusiasts."},
            {"PhoneMall 24h","24/7 service with genuine manufacturer warranty."},
            {"CyberTech Store","Cutting-edge PC components and peripherals."},
            {"TechBay Vietnam","Authorized dealer of top global tech brands."},
        };
        String[] data = shopData[(idx - 1) % shopData.length];

        String logoUrl = uploadToImageKit(
                "https://ui-avatars.com/api/?name=" + data[0].replace(" ", "+")
                        + "&size=200&background=random&color=fff&format=png",
                "shop-logo-" + idx + ".png", "/seed/shops");

        Shop shop = shopRepository.save(Shop.builder()
                .name(data[0])
                .description(data[1])
                .logo(logoUrl)
                .status("APPROVED")
                .approvedAt(LocalDateTime.now().minusDays(30 + random.nextInt(60)))
                .user(seller)
                .address(faker.address().fullAddress())
                .shopAddress(ShopAddress.builder()
                        .phoneNumber("09" + (10000000 + random.nextInt(90000000)))
                        .province("TP Hồ Chí Minh").provinceId("202")
                        .district("Quận " + (1 + idx)).districtId(1442 + idx)
                        .ward("Phường Bến Nghé").wardCode("21012")
                        .fullAddress(faker.address().fullAddress())
                        .detailAddress(faker.address().streetAddress())
                        .build())
                .build());

        log.info("[SEED]   🏪 {}", data[0]);
        return shop;
    }

    // ═══════════════════════════════════════════════════════════
    // Categories
    // ═══════════════════════════════════════════════════════════
    private Map<String, Category> createCategories() {
        Map<String, Category> map = new LinkedHashMap<>();
        for (Blueprint bp : BPS) {
            String catImgUrl = uploadToImageKit(
                    "https://ui-avatars.com/api/?name=" + bp.category.replace(" ", "+")
                            + "&size=200&background=0D8ABC&color=fff&format=png",
                    "cat-" + bp.category.toLowerCase().replace(" ", "-") + ".png",
                    "/seed/categories");

            Category cat = categoryRepository.save(Category.builder()
                    .name(bp.category)
                    .description("Browse the latest " + bp.category.toLowerCase() + " from top brands.")
                    .imageUrl(catImgUrl)
                    .build());
            map.put(bp.category, cat);
        }
        log.info("[SEED]   📂 Created {} categories", map.size());
        return map;
    }

    // ═══════════════════════════════════════════════════════════
    // Product + EAV (attributes, detail options, variants)
    // ═══════════════════════════════════════════════════════════
    private Product createProductWithEAV(Shop shop, Category category,
                                         Blueprint bp, String productName, int globalIdx) {
        long basePrice = bp.basePrices[globalIdx % bp.basePrices.length];

        Product product = productRepository.save(Product.builder()
                .name(productName)
                .description(buildDescription(productName, bp.category))
                .shop(shop).category(category)
                .minPrice(BigDecimal.valueOf(basePrice))
                .maxPrice(BigDecimal.valueOf(basePrice))
                .totalSold((long) random.nextInt(500))
                .weight(BigDecimal.valueOf(bp.wt))
                .length(BigDecimal.valueOf(bp.ln))
                .width(BigDecimal.valueOf(bp.wd))
                .height(BigDecimal.valueOf(bp.ht))
                .build());

        // Product images (3 per product, uploaded to ImageKit)
        for (int i = 0; i < 3; i++) {
            String srcUrl = "https://picsum.photos/seed/" + bp.imgSeed + (globalIdx * 10 + i) + "/800/800";
            String imgUrl = uploadToImageKit(srcUrl,
                    slug(productName) + "-" + (i + 1) + ".jpg", "/seed/products");

            productImageRepository.save(ProductImage.builder()
                    .url(imgUrl).isMain(i == 0).product(product).build());
        }

        // EAV: create attributes + detail options
        List<List<DetailAttribute>> allDetails = new ArrayList<>();
        for (int a = 0; a < bp.attrNames.length; a++) {
            ProductAttribute attr = productAttributeRepository.save(ProductAttribute.builder()
                    .name(bp.attrNames[a]).product(product).status("ACTIVE").sortOrder(a).build());

            List<DetailAttribute> details = new ArrayList<>();
            for (int o = 0; o < bp.attrOptions[a].length; o++) {
                details.add(detailAttributeRepository.save(DetailAttribute.builder()
                        .name(bp.attrOptions[a][o]).productAttribute(attr)
                        .status("ACTIVE").sortOrder(o).build()));
            }
            allDetails.add(details);
        }

        // Variants = cartesian product of all attribute options
        List<List<DetailAttribute>> combos = cartesian(allDetails);
        List<ProductVariant> variants = new ArrayList<>();
        BigDecimal minP = BigDecimal.valueOf(Long.MAX_VALUE), maxP = BigDecimal.ZERO;

        for (int vi = 0; vi < combos.size(); vi++) {
            List<DetailAttribute> combo = combos.get(vi);
            StringJoiner sj = new StringJoiner(" / ");
            combo.forEach(d -> sj.add(d.getName()));

            BigDecimal price = BigDecimal.valueOf(basePrice + vi * 500_000L);
            if (price.compareTo(minP) < 0) minP = price;
            if (price.compareTo(maxP) > 0) maxP = price;

            String variantImgSrc = "https://picsum.photos/seed/" + bp.imgSeed + "-v" + vi + "/800/800";
            String variantMainImg = uploadToImageKit(variantImgSrc,
                    slug(productName) + "-v" + vi + "-1.jpg", "/seed/variants");

            ProductVariant v = productVariantRepository.save(ProductVariant.builder()
                    .name(productName + " - " + sj)
                    .sku("SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .price(price).stock(20L + random.nextInt(200)).soldCount((long) random.nextInt(80))
                    .status("ACTIVE")
                    .imageUrl(variantMainImg)
                    .weight(BigDecimal.valueOf(bp.wt)).length(BigDecimal.valueOf(bp.ln))
                    .width(BigDecimal.valueOf(bp.wd)).height(BigDecimal.valueOf(bp.ht))
                    .product(product).detailAttributes(new HashSet<>(combo))
                    .build());

            // Upload 2 images per variant (main + 1 extra)
            productVariantImageRepository.save(ProductVariantImage.builder()
                    .url(variantMainImg).isMain(true).variant(v).build());
            String variantImg2 = uploadToImageKit(
                    "https://picsum.photos/seed/" + bp.imgSeed + "-v" + vi + "b/800/800",
                    slug(productName) + "-v" + vi + "-2.jpg", "/seed/variants");
            productVariantImageRepository.save(ProductVariantImage.builder()
                    .url(variantImg2).isMain(false).variant(v).build());

            variants.add(v);
        }

        product.setMinPrice(minP);
        product.setMaxPrice(maxP);
        product.setVariants(new HashSet<>(variants));
        productRepository.save(product);

        log.info("[SEED]   📦 {} → {} variants", productName, variants.size());
        return product;
    }

    private String buildDescription(String name, String category) {
        return name + " — part of our " + category.toLowerCase() + " collection.\n\n"
                + "✅ Genuine product with manufacturer warranty\n"
                + "✅ Fast nationwide shipping\n"
                + "✅ Easy 30-day return policy\n\n"
                + faker.lorem().paragraph(2);
    }

    private String slug(String name) {
        return name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private List<List<DetailAttribute>> cartesian(List<List<DetailAttribute>> lists) {
        List<List<DetailAttribute>> result = new ArrayList<>();
        result.add(new ArrayList<>());
        for (List<DetailAttribute> list : lists) {
            List<List<DetailAttribute>> next = new ArrayList<>();
            for (List<DetailAttribute> existing : result)
                for (DetailAttribute item : list) {
                    List<DetailAttribute> combo = new ArrayList<>(existing);
                    combo.add(item);
                    next.add(combo);
                }
            result = next;
        }
        return result;
    }

    // ═══════════════════════════════════════════════════════════
    // Warehouse + Stock
    // ═══════════════════════════════════════════════════════════
    private Warehouse createWarehouse(Shop shop) {
        Warehouse wh = warehouseRepository.save(Warehouse.builder()
                .name("Kho " + shop.getName())
                .contactName(faker.name().fullName())
                .contactPhone("09" + (10000000 + random.nextInt(90000000)))
                .shop(shop).status("ACTIVE")
                .province("TP Hồ Chí Minh").provinceId("202")
                .district("Quận 7").districtId(1455)
                .ward("Phường Tân Phú").wardCode("21414")
                .fullAddress(faker.address().fullAddress())
                .detailAddress(faker.address().streetAddress())
                .isDefault(true)
                .build());
        log.info("[SEED]   🏭 {}", wh.getName());
        return wh;
    }

    private void createWarehouseStock(Warehouse warehouse, List<ProductVariant> variants) {
        for (ProductVariant v : variants) {
            warehouseStockRepository.save(WarehouseStock.builder()
                    .warehouse(warehouse).productVariant(v)
                    .stockQuantity(v.getStock() != null ? v.getStock() : 50L)
                    .reservedQuantity(0L).build());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Reviews
    // ═══════════════════════════════════════════════════════════
    private void createReviews(Product product, List<ProductVariant> variants, List<User> buyers) {
        String[] comments = {
            "Sản phẩm chất lượng tuyệt vời, đóng gói cẩn thận!",
            "Đúng mô tả, giá hợp lý. Rất hài lòng!",
            "Mua lần 2 rồi, shop giao nhanh. Recommend!",
            "Hàng chính hãng, có bảo hành đàng hoàng.",
            "Giá tốt nhất thị trường, ship nhanh. 5 sao!",
            "Design đẹp, cầm chắc tay. Pin trâu.",
            "Shop tư vấn nhiệt tình, sẽ ủng hộ tiếp.",
            "Dùng 2 tuần rồi, vẫn hoạt động tốt.",
            "Giao hàng siêu nhanh, đóng gói kỹ lưỡng. Tuyệt vời!",
            "Mình mua về tặng bạn, bạn mình thích lắm. Cảm ơn shop!",
            "Sản phẩm y hình, dùng thử 1 tuần vẫn ổn định.",
            "Giá cực kỳ ổn so với chất lượng nhận được.",
            "Shop phản hồi nhanh, hỗ trợ nhiệt tình. Sẽ ủng hộ lần sau!",
            "Màu sắc đúng như mô tả, chất liệu tốt. Full 5 sao!",
            "Lần đầu mua nhưng rất ưng. Chắc chắn quay lại!",
            "Giao rất nhanh, hàng chắc đẹp. Shop uy tín lắm!",
            "Phụ kiện đi kèm đầy đủ, thóng.",
            "Kết nối ổn định, pin lâu. Hài lòng 100%.",
            "Giảm giá tốt, màu đẹp, hàng thật. Quá ổn!",
            "Thiết kế sang trọng, hiệu năng tốt, rất xứng đáng.",
        };
        for (int i = 0; i < REVIEWS_PER_PRODUCT && i < buyers.size(); i++) {
            customerReviewRepository.save(CustomerReview.builder()
                    .id(UUID.randomUUID().toString())
                    .rating(3 + random.nextInt(3))
                    .comment(comments[i % comments.length])
                    .productVariant(variants.get(i % variants.size()))
                    .user(buyers.get(i))
                    .build());
        }
    }

    // ═══════════════════════════════════════════════════════════
    // Coupons
    // ═══════════════════════════════════════════════════════════
    private List<Coupon> createPlatformCoupons() {
        LocalDateTime now = LocalDateTime.now();
        List<Coupon> list = new ArrayList<>();

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("WELCOME10")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.TEN)
                .maxDiscount(BigDecimal.valueOf(100_000))
                .minOrderAmount(BigDecimal.valueOf(200_000))
                .maxUsage(1000)
                .maxUsagePerUser(1)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusMonths(3))
                .description("Welcome! 10% off your first order (max 100k)")
                .isActive(true)
                .build()));

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("FREESHIP")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.FREE_SHIPPING)
                .discountValue(BigDecimal.valueOf(30_000))
                .maxDiscount(BigDecimal.valueOf(30_000))
                .minOrderAmount(BigDecimal.valueOf(150_000))
                .maxUsage(5000)
                .maxUsagePerUser(3)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusMonths(6))
                .description("Free shipping up to 30k on orders over 150k")
                .isActive(true)
                .build()));

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("SAVE50K")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(50_000))
                .minOrderAmount(BigDecimal.valueOf(500_000))
                .maxUsage(500)
                .maxUsagePerUser(1)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusMonths(2))
                .description("Save 50,000đ on orders over 500k")
                .isActive(true)
                .build()));

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("TECH200K")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(200_000))
                .minOrderAmount(BigDecimal.valueOf(2_000_000))
                .maxUsage(300)
                .maxUsagePerUser(1)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusMonths(1))
                .description("Save 200,000đ on tech orders over 2M")
                .isActive(true)
                .build()));

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("FLASH15")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .maxDiscount(BigDecimal.valueOf(300_000))
                .minOrderAmount(BigDecimal.valueOf(1_000_000))
                .maxUsage(200)
                .maxUsagePerUser(1)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusDays(14))
                .description("Flash sale: 15% off (max 300k) on orders over 1M")
                .isActive(true)
                .build()));

        list.add(couponRepository.save(Coupon.builder()
                .id(UUID.randomUUID().toString())
                .code("NEWUSER20")
                .couponType(CouponType.PLATFORM)
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscount(BigDecimal.valueOf(200_000))
                .minOrderAmount(BigDecimal.valueOf(300_000))
                .maxUsage(2000)
                .maxUsagePerUser(1)
                .currentUsage(0)
                .validFrom(now.minusDays(1))
                .validTo(now.plusMonths(6))
                .description("New user: 20% off first purchase (max 200k)")
                .isActive(true)
                .build()));

        log.info("[SEED]   🎟️  Created {} platform coupons", list.size());
        return list;
    }

    // ═══════════════════════════════════════════════════════════
    // Shop Coupons
    // ═══════════════════════════════════════════════════════════
    private void createShopCoupons(List<Shop> shops) {
        LocalDateTime now = LocalDateTime.now();
        int total = 0;
        String[][] shopCouponTemplates = {
            {"SHOP%dSALE10", "PERCENTAGE", "10", "200000", "500000", "10% off store-wide"},
            {"SHOP%dFREE30K", "FREE_SHIPPING", "30000", "30000", "150000", "Free shipping for orders over 150k"},
            {"SHOP%dVIP50K", "FIXED_AMOUNT", "50000", null, "800000", "VIP: 50k off orders over 800k"},
            {"SHOP%dNEW15", "PERCENTAGE", "15", "150000", "300000", "New customer 15% off"},
        };
        for (int s = 0; s < shops.size(); s++) {
            Shop shop = shops.get(s);
            int templateIdx = s % shopCouponTemplates.length;
            String[] tpl = shopCouponTemplates[templateIdx];
            String code = String.format(tpl[0], s + 1);
            BigDecimal discountValue = new BigDecimal(tpl[2]);
            BigDecimal maxDiscount = tpl[3] != null ? new BigDecimal(tpl[3]) : null;
            BigDecimal minOrder = new BigDecimal(tpl[4]);
            couponRepository.save(Coupon.builder()
                    .id(UUID.randomUUID().toString())
                    .code(code)
                    .couponType(CouponType.SHOP)
                    .discountType(DiscountType.valueOf(tpl[1]))
                    .discountValue(discountValue)
                    .maxDiscount(maxDiscount)
                    .minOrderAmount(minOrder)
                    .maxUsage(500)
                    .maxUsagePerUser(2)
                    .currentUsage(0)
                    .validFrom(now.minusDays(1))
                    .validTo(now.plusMonths(2))
                    .description(tpl[5])
                    .shop(shop)
                    .isActive(true)
                    .build());
            total++;
        }
        log.info("[SEED]   🏪🎟️  Created {} shop coupons", total);
    }

    // ═══════════════════════════════════════════════════════════
    // Permissions + RolePermissions
    // ═══════════════════════════════════════════════════════════
    private void createPermissions(Map<String, Role> roles) {
        // resource → [actions]
        Map<String, String[]> resourceActions = new LinkedHashMap<>();
        resourceActions.put("PRODUCT",    new String[]{"VIEW","CREATE","UPDATE","DELETE"});
        resourceActions.put("ORDER",      new String[]{"VIEW","CREATE","UPDATE","CANCEL"});
        resourceActions.put("USER",       new String[]{"VIEW","CREATE","UPDATE","DELETE","BAN"});
        resourceActions.put("SHOP",       new String[]{"VIEW","CREATE","UPDATE","DELETE","APPROVE"});
        resourceActions.put("COUPON",     new String[]{"VIEW","CREATE","UPDATE","DELETE"});
        resourceActions.put("CATEGORY",   new String[]{"VIEW","CREATE","UPDATE","DELETE"});
        resourceActions.put("WAREHOUSE",  new String[]{"VIEW","CREATE","UPDATE","DELETE"});
        resourceActions.put("REPORT",     new String[]{"VIEW","EXPORT"});
        resourceActions.put("REVIEW",     new String[]{"VIEW","DELETE"});
        resourceActions.put("DISPUTE",    new String[]{"VIEW","RESOLVE"});

        Map<String, Permission> all = new LinkedHashMap<>();
        for (Map.Entry<String, String[]> entry : resourceActions.entrySet()) {
            for (String action : entry.getValue()) {
                String name = entry.getKey() + "_" + action;
                Permission p = permissionRepository.save(Permission.builder()
                        .name(name)
                        .module(entry.getKey())
                        .description(action + " " + entry.getKey().toLowerCase())
                        .build());
                all.put(name, p);
            }
        }

        Role admin  = roles.get(PredefinedRole.ADMIN);
        Role seller = roles.get(PredefinedRole.SELLER);
        Role user   = roles.get(PredefinedRole.USER);

        // Admin gets ALL permissions
        all.values().forEach(p -> rolePermissionRepository.save(new RolePermission(admin, p)));

        // Seller: manage own products, orders, warehouses, view coupons
        List<String> sellerPerms = List.of(
                "PRODUCT_VIEW","PRODUCT_CREATE","PRODUCT_UPDATE","PRODUCT_DELETE",
                "ORDER_VIEW","ORDER_UPDATE",
                "WAREHOUSE_VIEW","WAREHOUSE_CREATE","WAREHOUSE_UPDATE",
                "COUPON_VIEW","COUPON_CREATE","COUPON_UPDATE",
                "REVIEW_VIEW","DISPUTE_VIEW","DISPUTE_RESOLVE",
                "REPORT_VIEW","REPORT_EXPORT");
        sellerPerms.stream().map(all::get).filter(Objects::nonNull)
                .forEach(p -> rolePermissionRepository.save(new RolePermission(seller, p)));

        // User: view products/orders/reviews
        List<String> userPerms = List.of(
                "PRODUCT_VIEW","ORDER_VIEW","ORDER_CREATE","ORDER_CANCEL","REVIEW_VIEW");
        userPerms.stream().map(all::get).filter(Objects::nonNull)
                .forEach(p -> rolePermissionRepository.save(new RolePermission(user, p)));

        log.info("[SEED]   🔑 Created {} permissions, {} role-permission links",
                all.size(), rolePermissionRepository.count());
    }

    // ═══════════════════════════════════════════════════════════
    // Carts
    // ═══════════════════════════════════════════════════════════
    private void createCarts(List<User> buyers, List<ProductVariant> variants) {
        List<ProductVariant> active = variants.stream()
                .filter(v -> "ACTIVE".equals(v.getStatus())).toList();
        int total = 0;
        Set<String> seen = new HashSet<>();
        for (User buyer : buyers) {
            int itemCount = 4 + random.nextInt(7); // 4–10 items
            List<ProductVariant> shuffled = new ArrayList<>(active);
            Collections.shuffle(shuffled, random);
            for (ProductVariant v : shuffled) {
                if (total >= itemCount) break;
                String key = buyer.getId() + ":" + v.getId();
                if (seen.contains(key)) continue;
                seen.add(key);
                cartItemRepository.save(CartItem.builder()
                        .user(buyer).productVariant(v)
                        .quantity(1 + random.nextInt(3)).build());
                total++;
            }
        }
        log.info("[SEED]   🛒 Created {} cart items", total);
    }

    // ═══════════════════════════════════════════════════════════
    // Wishlists
    // ═══════════════════════════════════════════════════════════
    private void createWishlists(List<User> buyers, List<Product> products) {
        int total = 0;
        Set<String> seen = new HashSet<>();
        for (User buyer : buyers) {
            List<Product> shuffled = new ArrayList<>(products);
            Collections.shuffle(shuffled, random);
            int count = 5 + random.nextInt(8); // 5–12 wishlist items
            for (int i = 0; i < count && i < shuffled.size(); i++) {
                String key = buyer.getId() + ":" + shuffled.get(i).getId();
                if (seen.contains(key)) continue;
                seen.add(key);
                wishlistRepository.save(Wishlist.builder()
                        .user(buyer).product(shuffled.get(i)).build());
                total++;
            }
        }
        log.info("[SEED]   ❤️  Created {} wishlist items", total);
    }

    // ═══════════════════════════════════════════════════════════
    // Shop Followers
    // ═══════════════════════════════════════════════════════════
    private void createShopFollowers(List<User> buyers, List<Shop> shops) {
        int total = 0;
        Set<String> seen = new HashSet<>();
        for (User buyer : buyers) {
            int followCount = 1 + random.nextInt(shops.size());
            List<Shop> shuffled = new ArrayList<>(shops);
            Collections.shuffle(shuffled, random);
            for (int i = 0; i < followCount; i++) {
                String key = buyer.getId() + ":" + shuffled.get(i).getId();
                if (seen.contains(key)) continue;
                seen.add(key);
                shopFollowerRepository.save(ShopFollower.builder()
                        .user(buyer).shop(shuffled.get(i)).build());
                total++;
            }
        }
        log.info("[SEED]   👥 Created {} shop followers", total);
    }

    // ═══════════════════════════════════════════════════════════
    // User Coupons
    // ═══════════════════════════════════════════════════════════
    private void createUserCoupons(List<User> buyers, List<Coupon> coupons) {
        int total = 0;
        for (User buyer : buyers) {
            for (Coupon coupon : coupons) {
                userCouponRepository.save(UserCoupon.builder()
                        .id(UUID.randomUUID().toString())
                        .user(buyer).couponId(coupon.getId()).used(false).build());
                total++;
            }
        }
        log.info("[SEED]   🎫 Assigned {} user coupons", total);
    }

    // ═══════════════════════════════════════════════════════════
    // Orders
    // ═══════════════════════════════════════════════════════════
    private void createOrders(List<User> buyers, List<Shop> shops,
                               List<Warehouse> warehouses, List<ProductVariant> variants) {
        String[][] addresses = {
            {"Nguyễn Văn A","0901234567","21012","1442","201","Hà Nội","Quận Hoàn Kiếm","Phường Tràng Tiền"},
            {"Trần Thị B",  "0912345678","20308","1443","202","TP Hồ Chí Minh","Quận 1","Phường Bến Nghé"},
            {"Lê Văn C",    "0923456789","20608","1527","203","Đà Nẵng","Quận Hải Châu","Phường Thạch Thang"},
        };

        OrderStatus[] statuses = {
            OrderStatus.COMPLETED, OrderStatus.COMPLETED, OrderStatus.DELIVERED,
            OrderStatus.SHIPPING, OrderStatus.CONFIRMED, OrderStatus.CANCELLED
        };

        int orderCount = 0;
        List<ProductVariant> active = variants.stream()
                .filter(v -> "ACTIVE".equals(v.getStatus())).toList();

        for (int b = 0; b < buyers.size(); b++) {
            User buyer = buyers.get(b);
            int numOrders = 3 + random.nextInt(6); // 3–8 orders per buyer

            for (int o = 0; o < numOrders; o++) {
                Shop shop = shops.get((b + o) % shops.size());
                Warehouse warehouse = warehouses.get((b + o) % warehouses.size());
                String[] addr = addresses[random.nextInt(addresses.length)];
                OrderStatus status = statuses[(b * 3 + o) % statuses.length];

                BigDecimal shippingFee = BigDecimal.valueOf(30_000);
                BigDecimal subtotal   = BigDecimal.ZERO;

                // Pick 1–3 variants for this order
                List<ProductVariant> picked = new ArrayList<>();
                List<ProductVariant> shopVariants = active.stream()
                        .filter(v -> shop.getId().equals(v.getProduct().getShop().getId()))
                        .toList();
                if (shopVariants.isEmpty()) shopVariants = active;
                List<ProductVariant> shuffled = new ArrayList<>(shopVariants);
                Collections.shuffle(shuffled, random);
                int itemCount = 1 + random.nextInt(Math.min(3, shuffled.size()));
                for (int i = 0; i < itemCount; i++) picked.add(shuffled.get(i));

                for (ProductVariant v : picked)
                    subtotal = subtotal.add(v.getPrice().multiply(BigDecimal.valueOf(1 + random.nextInt(2))));

                BigDecimal total = subtotal.add(shippingFee);

                Order order = orderRepository.save(Order.builder()
                        .status(status)
                        .user(buyer)
                        .payment("VNPAY")
                        .subtotal(subtotal)
                        .shippingFee(shippingFee)
                        .total(total)
                        .totalDiscount(BigDecimal.ZERO)
                        .discountAmount(BigDecimal.ZERO)
                        .shopDiscountAmount(BigDecimal.ZERO)
                        .shippingDiscountAmount(BigDecimal.ZERO)
                        .isPaid(status != OrderStatus.AWAITING_PAYMENT && status != OrderStatus.CANCELLED)
                        .version(0L)
                        .build());

                // Shipping address
                ShippingAddress shipping = ShippingAddress.builder()
                        .receiverName(addr[0]).phoneNumber(addr[1])
                        .wardCode(addr[2]).districtId(Integer.parseInt(addr[3])).provinceId(addr[4])
                        .province(addr[5]).district(addr[6]).ward(addr[7])
                        .fullAddress(addr[7] + ", " + addr[6] + ", " + addr[5])
                        .detailAddress(faker.address().streetAddress())
                        .order(order).build();
                order.setShippingAddress(shipping);

                // OrderShopGroup
                OrderShopGroup group = orderShopGroupRepository.save(OrderShopGroup.builder()
                        .order(order).shop(shop).warehouse(warehouse)
                        .subtotal(subtotal).shippingFee(shippingFee)
                        .total(total).totalDiscount(BigDecimal.ZERO)
                        .shipment("GHN").build());

                // OrderItems
                for (ProductVariant v : picked) {
                    int qty = 1 + random.nextInt(2);
                    ProductImage mainImg = v.getProduct().getImages().stream()
                            .filter(img -> Boolean.TRUE.equals(img.getIsMain())).findFirst()
                            .orElse(v.getProduct().getImages().isEmpty() ? null
                                    : v.getProduct().getImages().iterator().next());

                    orderItemRepository.save(OrderItem.builder()
                            .orderShopGroup(group)
                            .productVariant(v)
                            .productId(v.getProduct().getId())
                            .productName(v.getProduct().getName())
                            .productImage(mainImg != null ? mainImg.getUrl() : null)
                            .variantName(v.getName())
                            .variantSku(v.getSku())
                            .quantity(qty)
                            .price(v.getPrice())
                            .build());
                }

                orderCount++;
            }
        }
        log.info("[SEED]   📋 Created {} orders", orderCount);
    }

    // ═══════════════════════════════════════════════════════════
    // Search History
    // ═══════════════════════════════════════════════════════════
    private void createSearchHistory(List<User> buyers) {
        String[] keywords = {"iPhone","Samsung","laptop gaming","tai nghe chống ồn","đồng hồ thông minh",
                "máy tính bảng","loa bluetooth","phụ kiện điện thoại","bàn phím cơ","chuột gaming",
                "AirPods","MacBook","ốp lưng","sạc nhanh","màn hình di động"};
        int total = 0;
        for (User buyer : buyers) {
            int count = 3 + random.nextInt(5);
            for (int i = 0; i < count; i++) {
                searchHistoryRepository.save(SearchHistory.builder()
                        .user(buyer)
                        .keyword(keywords[random.nextInt(keywords.length)])
                        .build());
                total++;
            }
        }
        log.info("[SEED]   🔍 Created {} search history records", total);
    }
}
