package com.cpt202_1.taskmanager.controllers;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api")
public class taskController {

    private final JdbcTemplate jdbcTemplate;

    public taskController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // 1. ping database
    // 2. show database status page
    @GetMapping("/db/ping")
    public Map<String, Object> pingDatabase() {
        Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return Map.of(
                "status", "ok",
                "database", "CPT202_Project_DB",
                "result", result);
    }

    @GetMapping(value = "/db/view", produces = MediaType.TEXT_HTML_VALUE)
    public String databaseView() {
        try {
            String databaseName = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            String serverTime = jdbcTemplate.queryForObject(
                    "SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s')",
                    String.class);

            return """
                    <html>
                      <body style="font-family: Arial, sans-serif; padding: 24px;">
                        <h2>Database Connected</h2>
                        <p>Status: <b style="color: green;">OK</b></p>
                        <p>Database: %s</p>
                        <p>Server Time: %s</p>
                      </body>
                    </html>
                    """.formatted(databaseName, serverTime);
        } catch (Exception ex) {
            String reason = rootCauseMessage(ex);
            return """
                    <html>
                      <body style="font-family: Arial, sans-serif; padding: 24px;">
                        <h2>Database Connection Failed</h2>
                        <p>Status: <b style="color: red;">ERROR</b></p>
                        <p>Reason: %s</p>
                      </body>
                    </html>
                    """.formatted(htmlEscape(reason));
        }
    }

    private String rootCauseMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current.getMessage() == null ? "Unknown database error" : current.getMessage();
    }

    private String htmlEscape(String raw) {
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
