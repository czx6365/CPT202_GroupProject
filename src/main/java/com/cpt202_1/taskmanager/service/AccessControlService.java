package com.cpt202_1.taskmanager.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.cpt202_1.taskmanager.exception.ApiException;
import com.cpt202_1.taskmanager.pojo.Category;
import com.cpt202_1.taskmanager.pojo.ResourceEntry;
import com.cpt202_1.taskmanager.pojo.User;
import com.cpt202_1.taskmanager.pojo.enums.UserRole;
import com.cpt202_1.taskmanager.repository.CategoryRepository;
import com.cpt202_1.taskmanager.repository.ResourceEntryRepository;
import com.cpt202_1.taskmanager.repository.UserRepository;
@Service
public class AccessControlService {
    private final UserRepository userRepository;
    private final ResourceEntryRepository resourceEntryRepository;
    private final CategoryRepository categoryRepository;

    public AccessControlService(
            UserRepository userRepository,
            ResourceEntryRepository resourceEntryRepository,
            CategoryRepository categoryRepository) {
        this.userRepository = userRepository;
        this.resourceEntryRepository = resourceEntryRepository;
        this.categoryRepository = categoryRepository;
    }

    public User getUserOrThrow(Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "actorId/userId is required");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found: " + userId));
    }

    public ResourceEntry getResourceOrThrow(Long resourceId) {
        return resourceEntryRepository.findById(resourceId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Resource not found: " + resourceId));
    }

    public Category getCategoryOrThrow(Long categoryId) {
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "categoryId is required");
        }

        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found: " + categoryId));
    }

    public void requireRole(User user, UserRole role) {
        if (user.getRole() != role) {
            throw new ApiException(HttpStatus.FORBIDDEN, "User role not allowed for this action");
        }
    }

    public void requireOwner(User actor, ResourceEntry entry) {
        if (!entry.getContributor().getUserId().equals(actor.getUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only owner contributor can modify this resource");
        }
    }
}
