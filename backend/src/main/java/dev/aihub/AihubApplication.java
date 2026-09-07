package dev.aihub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling powers dev.aihub.ingestion.MediaCleanupScheduler (AC-8).
@SpringBootApplication
@EnableScheduling
public class AihubApplication {

    public static void main(String[] args) {
        SpringApplication.run(AihubApplication.class, args);
    }
}
