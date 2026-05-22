package com.taivs.EcommerceWeb.config;

import com.taivs.EcommerceWeb.repositories.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.taivs.EcommerceWeb.models.user.User;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DevPasswordResetRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // Uncomment to run the reset
        // log.info("STARTING PASSWORD RESET FOR ALL USERS TO 'Password1'");
        // List<User> users = userRepository.findAll();
        // String encodedPassword = passwordEncoder.encode("Password1");
        // for (User user : users) {
        //     user.setPassword(encodedPassword);
        // }
        // userRepository.saveAll(users);
        // log.info("FINISHED PASSWORD RESET FOR {} USERS", users.size());
    }
}
