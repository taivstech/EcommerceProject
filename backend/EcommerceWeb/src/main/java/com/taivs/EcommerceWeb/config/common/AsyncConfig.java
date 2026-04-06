package com.taivs.EcommerceWeb.config.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
@EnableScheduling
@Slf4j
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        int cpuCores = Runtime.getRuntime().availableProcessors();

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(cpuCores * 2);
        executor.setMaxPoolSize(cpuCores * 4);
        executor.setQueueCapacity(1000);
        executor.setKeepAliveSeconds(60);
        executor.setAllowCoreThreadTimeOut(true);
        executor.setThreadNamePrefix("async-");
        

        executor.setAwaitTerminationSeconds(30);
        executor.setWaitForTasksToCompleteOnShutdown(true);

        executor.setRejectedExecutionHandler(
            new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy()
        );
        
        executor.initialize();
        
        log.info("Async ThreadPoolTaskExecutor initialized: core={}, max={}, queue=1000",
                executor.getCorePoolSize(), executor.getMaxPoolSize());
        
        return executor;
    }

    @Bean
    public ThreadPoolTaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();

        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("schedule-");

        scheduler.setAwaitTerminationSeconds(30);
        scheduler.setWaitForTasksToCompleteOnShutdown(true);

        scheduler.setRejectedExecutionHandler((r, executor) -> {
            log.warn("Scheduled task rejected (pool exhausted): {}", r.getClass().getSimpleName());
            new java.util.concurrent.ThreadPoolExecutor.DiscardOldestPolicy()
                    .rejectedExecution(r, executor);
        });
        
        scheduler.initialize();
        
        log.info("  ThreadPoolTaskScheduler initialized:");
        log.info("  poolSize: {}", scheduler.getPoolSize());
        
        return scheduler;
    }
}
