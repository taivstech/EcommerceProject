package com.taivs.EcommerceWeb;

import com.taivs.EcommerceWeb.repositories.product.ProductSearchRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class EcommerceWebApplicationTests {
	@MockBean
	private ProductSearchRepository productSearchRepository;

	@MockBean
	private ElasticsearchOperations elasticsearchOperations;

	@Test
	void contextLoads() {
	}

}
