package com.cinema.cinemate.controller.admin;

import com.cinema.cinemate.request.ProfileUpdateRequest;
import com.cinema.cinemate.request.UpdateMemberRequest;
import com.cinema.cinemate.response.ApiResponse;
import com.cinema.cinemate.response.PageResponse;
import com.cinema.cinemate.response.UserResponse;
import com.cinema.cinemate.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller xử lý nghiệp vụ User management cho Admin.
 *
 * Chỉ user có role ADMIN mới được truy cập các endpoint trong controller này.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<UserResponse>> getAllUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getAllUsers())
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable UUID userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserById(userId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/email/{email}")
    public ApiResponse<UserResponse> getUserByEmail(@PathVariable String email) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserByEmail(email))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/members")
    public ApiResponse<PageResponse<UserResponse>> getMemberList(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        // Map camelCase to snake_case for native query
        String mappedSortBy = switch (sortBy) {
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            case "dayOfBirth" -> "day_of_birth";
            case "phoneNumber" -> "phone_number";
            case "identityCard" -> "identity_card";
            case "fullName" -> "full_name";
            case "score" -> "score";
            default -> sortBy;
        };

        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(mappedSortBy).ascending()
                : Sort.by(mappedSortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        PageResponse<UserResponse> result = userService.searchMembers(search, status, pageable);
        return ApiResponse.<PageResponse<UserResponse>>builder()
                .result(result)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/status")
    public ApiResponse<UserResponse> updateMemberStatus(
            @PathVariable UUID userId,
            @RequestParam String status) {
        UserResponse member = userService.updateMemberStatus(userId, status);
        return ApiResponse.<UserResponse>builder()
                .result(member)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/members/{memberId}")
    public ApiResponse<UserResponse> updateMember(
            @PathVariable UUID memberId,
            @RequestBody @Valid UpdateMemberRequest request) {
        UserResponse member = userService.updateMember(memberId, request);
        return ApiResponse.<UserResponse>builder()
                .result(member)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/members/{memberId}")
    public ApiResponse<String> deleteMember(@PathVariable UUID memberId) {
        userService.deleteMember(memberId);
        return ApiResponse.<String>builder()
                .message("Member has been deleted successfully.")
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}")
    public ApiResponse<UserResponse> updateUser(@AuthenticationPrincipal Jwt jwt,
                    @PathVariable UUID userId,
                    @RequestBody @Valid ProfileUpdateRequest request) {
        String adminIdStr = jwt.getClaim("userId");
        UUID adminId = UUID.fromString(adminIdStr);
        List<String> rolesList = jwt.getClaim("roles");
        java.util.Set<String> roles = rolesList != null ? new java.util.HashSet<>(rolesList)
                        : java.util.Collections.emptySet();

        UserResponse updatedUser = userService.updateProfile(userId, request, adminId, roles);
        return ApiResponse.<UserResponse>builder()
                .message("Update information successfully")
                .result(updatedUser)
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ApiResponse<String> deleteUser(@PathVariable UUID userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder()
                .result("User has been deleted successfully")
                .build();
    }
}
