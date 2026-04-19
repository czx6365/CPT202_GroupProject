package com.cpt202_1.taskmanager.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.cpt202_1.taskmanager.dto.response.AuditLogView;
import com.cpt202_1.taskmanager.pojo.AuditLog;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.AuditLogRepository;

import jakarta.persistence.criteria.Predicate;

@Service
@Transactional
public class AuditLogService {
    private final AccessControlService accessControlService;
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(
            AccessControlService accessControlService,
            AuditLogRepository auditLogRepository) {
        this.accessControlService = accessControlService;
        this.auditLogRepository = auditLogRepository;
    }

    public void log(
            User actor,
            String module,
            String action,
            String targetType,
            Long targetId,
            String targetName,
            String detail,
            String status) {
        AuditLog entry = new AuditLog();
        entry.setOperatorId(actor == null ? null : actor.getUserId());
        entry.setOperatorName(actor == null ? "System" : actor.getUserName());
        entry.setModule(module);
        entry.setAction(action);
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setTargetName(targetName);
        entry.setDetail(detail);
        entry.setStatus(status);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditLogView> listAuditLogs(Long actorId, String keyword, String module, String status) {
        User actor = accessControlService.getUserOrThrow(actorId);
        accessControlService.requireRole(actor, UserRole.ADMIN_REVIEWER);

        Specification<AuditLog> specification = (root, query, builder) -> {
            Predicate predicate = builder.conjunction();

            if (StringUtils.hasText(keyword)) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("operatorName")), normalizedKeyword),
                        builder.like(builder.lower(root.get("action")), normalizedKeyword),
                        builder.like(builder.lower(root.get("targetName")), normalizedKeyword),
                        builder.like(builder.lower(root.get("detail")), normalizedKeyword)));
            }

            if (StringUtils.hasText(module)) {
                predicate = builder.and(
                        predicate,
                        builder.equal(builder.lower(root.get("module")), module.trim().toLowerCase()));
            }

            if (StringUtils.hasText(status)) {
                predicate = builder.and(
                        predicate,
                        builder.equal(builder.lower(root.get("status")), status.trim().toLowerCase()));
            }

            return predicate;
        };

        return auditLogRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toView)
                .toList();
    }

    private AuditLogView toView(AuditLog entry) {
        return new AuditLogView(
                entry.getId(),
                entry.getOperatorId(),
                entry.getOperatorName(),
                entry.getModule(),
                entry.getAction(),
                entry.getTargetType(),
                entry.getTargetId(),
                entry.getTargetName(),
                entry.getDetail(),
                entry.getStatus(),
                entry.getCreatedAt());
    }
}
