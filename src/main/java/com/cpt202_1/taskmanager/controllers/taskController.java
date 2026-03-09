package com.cpt202_1.taskmanager.controllers;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class taskController {

    private final JdbcTemplate jdbcTemplate;

    public taskController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db/ping")
    public Map<String, Object> pingDatabase() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return Map.of(
                "status", "ok",
                "database", "CPT202_Project_DB",
                "result", result);
    }
}
