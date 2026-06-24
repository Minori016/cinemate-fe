package com.cinema.cinemate.service;

import com.cinema.cinemate.request.UserLoginRequest;
import com.cinema.cinemate.request.UserRegisterRequest;
import com.cinema.cinemate.response.UserResponse;
import com.cinema.cinemate.entity.User;
import com.cinema.cinemate.entity.Role;
import com.cinema.cinemate.entity.UserRole;
import com.cinema.cinemate.repository.UserRepository;
import com.cinema.cinemate.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.cinema.cinemate.enums.ErrorCode;
import com.cinema.cinemate.exception.AppException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.cinema.cinemate.request.ChangePasswordRequest;
import com.cinema.cinemate.request.ProfileUpdateRequest;
import com.cinema.cinemate.request.AddEmployeeRequest;
import com.cinema.cinemate.request.UpdateEmployeeRequest;
import com.cinema.cinemate.request.UpdateMemberRequest;
import com.cinema.cinemate.response.PageResponse;
import com.cinema.cinemate.service.AuthenticationService;
import com.cinema.cinemate.service.CloudinaryService;
import com.cinema.cinemate.service.EmailService;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service xử lý nghiệp vụ liên quan đến User:
 * - Đăng ký tài khoản mới (AC-01 → AC-06 của User Story Registration)
 * - Xác thực đăng nhập (AC-01 → AC-03 của User Story Login)
 * - CRUD user (cho Admin)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationService authenticationService;
    private final CloudinaryService cloudinaryService;

    // ========================
    // REGISTRATION (User Story 1)
    // ========================

    /**
     * Đăng ký tài khoản mới.
     *
     * Luồng xử lý:
     * 1. Kiểm tra password và confirmPassword có khớp không (AC-03)
     * 2. Kiểm tra email đã tồn tại chưa
     * 3. Hash password trước khi lưu (AC-06)
     * 4. Gán role mặc định MEMBER cho user mới
     * 5. Log sự kiện đăng ký kèm metadata (AC-05)
     *
     * @param request DTO chứa thông tin đăng ký từ client
     * @return UserResponse chứa thông tin user đã tạo (không bao gồm password)
     * @throws AppException nếu password không khớp hoặc email đã tồn tại
     */
    public UserResponse createUser(UserRegisterRequest request) {
        // AC-03: Kiểm tra Password và Confirm Password phải khớp nhau
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        // Kiểm tra email đã tồn tại trong hệ thống chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // Kiểm tra username đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        // Lấy role MEMBER mặc định (tạo mới nếu chưa có)
        Role memberRole = roleRepository.findByName("MEMBER")
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name("MEMBER")
                                .description("Default Member Role")
                                .build()
                ));

        // Tạo entity User từ request
        User user = new User();
        user.setEmail(request.getEmail().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // AC-06: Hash password
        user.setFullName(request.getFullName().trim());
        user.setUsername(request.getUsername().trim());
        user.setDayOfBirth(request.getDayOfBirth());
        user.setGender(request.getGender().trim());
        user.setPhoneNumber(request.getPhoneNumber().trim());
        user.setScore(0);
        user.setStatus("ACTIVE");

        // Gán role MEMBER cho user mới
        UserRole userRole = UserRole.builder()
                .user(user)
                .role(memberRole)
                .build();
        user.getUserRoles().add(userRole);

        // Lưu user vào database
        User savedUser = userRepository.save(user);

        // AC-05: Log sự kiện đăng ký kèm metadata (timestamp, account name, status)
        log.info("REGISTRATION_EVENT | account={} | email={} | status=SUCCESS | timestamp={}",
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getCreatedAt());

        return toUserResponse(savedUser);
    }

    // ========================
    // ADD EMPLOYEE (Admin/Manager)
    // ========================

    /**
     * Tạo nhân viên mới bởi Admin/Manager (AC-01 → AC-06).
     *
     * Luồng xử lý:
     * 1. Kiểm tra password và confirmPassword khớp nhau (AC-02)
     * 2. Kiểm tra username đã tồn tại chưa → trả message theo AC-04
     * 3. Kiểm tra email đã tồn tại chưa
     * 4. Hash password trước khi lưu (AC-02)
     * 5. Gán role STAFF hoặc MANAGER cho nhân viên mới
     * 6. Log sự kiện tạo nhân viên
     *
     * @param request DTO chứa thông tin nhân viên từ Admin/Manager
     * @return UserResponse chứa thông tin nhân viên đã tạo
     * @throws AppException nếu password không khớp, username/email đã tồn tại
     */
    public UserResponse createEmployee(AddEmployeeRequest request) {
        // AC-02: Kiểm tra Password và Confirm Password phải khớp nhau
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        // AC-02: Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        // AC-02 + AC-04: Kiểm tra username đã tồn tại chưa
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new AppException(ErrorCode.USERNAME_EXISTED);
        }

        // Lấy role từ request (STAFF hoặc MANAGER)
        Role employeeRole = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Tạo entity User từ request
        User employee = new User();
        employee.setEmail(request.getEmail().trim());
        employee.setPassword(passwordEncoder.encode(request.getPassword()));
        employee.setFullName(request.getFullName().trim());
        employee.setUsername(request.getUsername().trim());
        employee.setDayOfBirth(request.getDayOfBirth());
        employee.setGender(request.getGender().trim());
        employee.setIdentityCard(request.getIdentityCard().trim());
        employee.setPhoneNumber(request.getPhoneNumber().trim());
        employee.setAddress(request.getAddress().trim());
        employee.setScore(0);
        employee.setStatus("ACTIVE");

        // Gán role cho nhân viên mới
        UserRole userRole = UserRole.builder()
                .user(employee)
                .role(employeeRole)
                .build();
        employee.getUserRoles().add(userRole);

        // Lưu vào database
        User savedEmployee = userRepository.save(employee);

        // Log sự kiện tạo nhân viên
        log.info("ADD_EMPLOYEE_EVENT | account={} | email={} | role={} | status=SUCCESS | timestamp={}",
                savedEmployee.getUsername(),
                savedEmployee.getEmail(),
                request.getRole(),
                savedEmployee.getCreatedAt());

        return toUserResponse(savedEmployee);
    }

    // ========================
    // LOGIN / AUTHENTICATION (User Story 2)
    // ========================

    /**
     * Xác thực đăng nhập bằng email + password.
     *
     * Luồng xử lý:
     * 1. Tìm user theo email — nếu không tìm thấy → lỗi (AC-02)
     * 2. So sánh password đã hash — nếu sai → lỗi (AC-02)
     * 3. Kiểm tra trạng thái tài khoản — nếu LOCKED → lỗi (AC-03)
     *
     * Lưu ý bảo mật: Khi email không tồn tại hoặc password sai,
     * đều trả cùng 1 message "Email/password is invalid" để tránh lộ thông tin.
     *
     * @param request DTO chứa email và password
     * @return User entity nếu xác thực thành công
     * @throws AppException nếu sai credentials hoặc tài khoản bị khóa
     */
    public User authenticate(UserLoginRequest request) {
        // AC-02: Tìm user theo email — không tìm thấy thì trả lỗi chung
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        // AC-02: Kiểm tra password — sai thì trả lỗi chung (cùng message để bảo mật)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // AC-03: Kiểm tra tài khoản có bị khóa không
        if ("LOCKED".equals(user.getStatus())) {
            throw new AppException(ErrorCode.ACCOUNT_LOCKED);
        }

        return user;
    }

    // ========================
    // CHANGE PASSWORD (User Story: Change Password)
    // ========================

    /**
     * Đổi mật khẩu.
     */
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        // Verify new password and confirm password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_MISMATCH);
        }

        // Prevent setting the new password same as the current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
        }

        // Change password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("CHANGE_PASSWORD | email={} | timestamp={}", user.getEmail(), java.time.LocalDateTime.now());
    }

    /**
     * Cập nhật thông tin cá nhân của User (Edit Profile).
     */
    public UserResponse updateProfile(UUID targetUserId, ProfileUpdateRequest request, UUID actorId, Set<String> actorRoles) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> {
                    logEditEvent(actorId, actorRoles, targetUserId, java.util.Collections.emptySet(), "FAILED");
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        // Kiểm tra quyền: Chỉ chính chủ hoặc ADMIN/STAFF mới được quyền sửa
        if (!actorId.equals(targetUserId) && !actorRoles.contains("ADMIN") && !actorRoles.contains("STAFF")) {
            Set<String> targetRoles = targetUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());
            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "FAILED");
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        try {
            // Kiểm tra email duy nhất (nếu thay đổi email)
            if (!targetUser.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
                if (userRepository.existsByEmail(request.getEmail().trim())) {
                    throw new AppException(ErrorCode.USER_EXISTED);
                }
            }

            // Kiểm tra username duy nhất (nếu thay đổi username)
            if (targetUser.getUsername() == null || !targetUser.getUsername().equalsIgnoreCase(request.getUsername().trim())) {
                if (userRepository.existsByUsername(request.getUsername().trim())) {
                    throw new AppException(ErrorCode.USER_EXISTED);
                }
            }

            // Cập nhật thông tin
            targetUser.setUsername(request.getUsername().trim());
            targetUser.setEmail(request.getEmail().trim());
            targetUser.setPassword(passwordEncoder.encode(request.getPassword()));
            targetUser.setFullName(request.getFullName().trim());
            targetUser.setDayOfBirth(request.getDayOfBirth());
            targetUser.setGender(request.getGender().trim());
            targetUser.setIdentityCard(request.getIdentityCard().trim());
            targetUser.setPhoneNumber(request.getPhoneNumber().trim());
            targetUser.setAddress(request.getAddress().trim());

            User savedUser = userRepository.save(targetUser);

            Set<String> targetRoles = savedUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());

            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "SUCCESS");

            return toUserResponse(savedUser);

        } catch (Exception e) {
            Set<String> targetRoles = targetUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());
            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "FAILED");
            throw e;
        }
    }

    private void logEditEvent(UUID actorId, Set<String> actorRoles, UUID targetId, Set<String> targetRoles, String status) {
        UUID employeeId = null;
        UUID memberId = null;

        if (actorRoles.contains("ADMIN") || actorRoles.contains("STAFF")) {
            employeeId = actorId;
        }

        if (targetRoles.contains("MEMBER")) {
            memberId = targetId;
        }

        log.info("PROFILE_EDIT_EVENT | employeeId={} | memberId={} | status={} | timestamp={}",
                employeeId != null ? employeeId.toString() : "null",
                memberId != null ? memberId.toString() : "null",
                status,
                java.time.LocalDateTime.now());
    }

    /**
     * Upload Avatar for User
     */
    public UserResponse uploadAvatar(UUID targetUserId, MultipartFile file, UUID actorId, Set<String> actorRoles) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> {
                    logEditEvent(actorId, actorRoles, targetUserId, java.util.Collections.emptySet(), "FAILED");
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        // Tương tự Edit Profile, chỉ chủ tài khoản hoặc Admin/Staff mới được đổi avatar
        if (!actorId.equals(targetUserId) && !actorRoles.contains("ADMIN") && !actorRoles.contains("STAFF")) {
            Set<String> targetRoles = targetUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());
            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "FAILED");
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        try {
            // Upload to Cloudinary
            String imageUrl = cloudinaryService.uploadFile(file);

            // Update user image
            targetUser.setImage(imageUrl);
            User savedUser = userRepository.save(targetUser);

            Set<String> targetRoles = savedUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());

            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "SUCCESS");

            return toUserResponse(savedUser);

        } catch (IOException e) {
            Set<String> targetRoles = targetUser.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet());
            logEditEvent(actorId, actorRoles, targetUserId, targetRoles, "FAILED");
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Could add a specific FILE_UPLOAD_FAILED code
        }
    }

    // ========================
    // CRUD OPERATIONS (Admin)
    // ========================

    /** Lấy danh sách tất cả user */
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    /** Lấy thông tin user theo UUID */
    public UserResponse getUserById(UUID id) {
        return toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    /** Lấy thông tin user theo email */
    public UserResponse getUserByEmail(String email) {
        return toUserResponse(userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    /** Xóa user theo UUID */
    public void deleteUser(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        userRepository.deleteById(id);
    }

    // ========================
    // EMPLOYEE MANAGEMENT (Admin/Manager)
    // ========================

    /**
     * Cập nhật thông tin nhân viên (không bao gồm password).
     *
     * @param employeeId UUID của nhân viên cần cập nhật
     * @param request DTO chứa thông tin cập nhật
     * @return UserResponse chứa thông tin nhân viên đã cập nhật
     * @throws AppException nếu nhân viên không tồn tại
     */
    public UserResponse updateEmployee(UUID employeeId, UpdateEmployeeRequest request) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));

        // Kiểm tra email duy nhất (nếu thay đổi email)
        if (!employee.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new AppException(ErrorCode.USER_EXISTED);
            }
        }

        // Cập nhật thông tin
        employee.setEmail(request.getEmail().trim());
        employee.setFullName(request.getFullName().trim());
        employee.setDayOfBirth(request.getDayOfBirth());
        employee.setGender(request.getGender().trim());
        employee.setIdentityCard(request.getIdentityCard().trim());
        employee.setPhoneNumber(request.getPhoneNumber().trim());
        employee.setAddress(request.getAddress().trim());

        // Cập nhật role nếu thay đổi
        String currentRole = employee.getUserRoles().stream()
                .map(ur -> ur.getRole().getName())
                .findFirst()
                .orElse("STAFF");

        if (!currentRole.equals(request.getRole())) {
            // Xóa role cũ
            employee.getUserRoles().clear();

            // Lấy role mới
            Role newRole = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

            // Gán role mới
            UserRole userRole = UserRole.builder()
                    .user(employee)
                    .role(newRole)
                    .build();
            employee.getUserRoles().add(userRole);
        }

        User savedEmployee = userRepository.save(employee);

        log.info("UPDATE_EMPLOYEE_EVENT | employeeId={} | email={} | status=SUCCESS | timestamp={}",
                employeeId, savedEmployee.getEmail(), java.time.LocalDateTime.now());

        return toUserResponse(savedEmployee);
    }

    /**
     * Tìm kiếm & phân trang danh sách nhân viên (STAFF, MANAGER).
     *
     * @param search   từ khóa tìm kiếm (username, fullName, email, phoneNumber)
     * @param role     lọc theo role (STAFF / MANAGER), null = tất cả
     * @param pageable thông tin phân trang
     * @return PageResponse chứa danh sách nhân viên
     */
    public PageResponse<UserResponse> searchEmployees(String search, String role, Pageable pageable) {
        Page<User> employeePage = userRepository.findEmployeesWithFilters(search, role, pageable);

        List<UserResponse> employees = employeePage.getContent().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(employees)
                .pageNumber(employeePage.getNumber())
                .pageSize(employeePage.getSize())
                .totalElements(employeePage.getTotalElements())
                .totalPages(employeePage.getTotalPages())
                .last(employeePage.isLast())
                .build();
    }

    /**
     * Xóa nhân viên theo UUID.
     *
     * @param employeeId UUID của nhân viên cần xóa
     * @throws AppException nếu nhân viên không tồn tại
     */
    public void deleteEmployee(UUID employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new AppException(ErrorCode.EMPLOYEE_NOT_FOUND));

        Set<String> roles = employee.getUserRoles().stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        if (!roles.contains("STAFF") && !roles.contains("MANAGER")) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        userRepository.delete(employee);

        log.info("DELETE_EMPLOYEE_EVENT | employeeId={} | roles={} | status=SUCCESS | timestamp={}",
                employeeId, roles, java.time.LocalDateTime.now());
    }

    /**
     * Lấy User entity theo UUID (dùng nội bộ giữa các service)
     */
    public User getUserEntityById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    /**
     * Lấy User entity theo email (dùng cho JWT-based controller)
     */
    public User getUserEntityByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    // ========================
    // MEMBER MANAGEMENT (Admin)
    // ========================

    /**
     * Tìm kiếm & phân trang danh sách thành viên (MEMBER).
     *
     * @param search   từ khóa tìm kiếm (username, fullName, email, phoneNumber)
     * @param status   lọc theo trạng thái (ACTIVE / LOCKED), null = tất cả
     * @param pageable thông tin phân trang
     * @return PageResponse chứa danh sách thành viên
     */
    public PageResponse<UserResponse> searchMembers(String search, String status, Pageable pageable) {
        Page<User> memberPage = userRepository.findMembersWithFilters(search, status, pageable);

        List<UserResponse> members = memberPage.getContent().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());

        return PageResponse.<UserResponse>builder()
                .content(members)
                .pageNumber(memberPage.getNumber())
                .pageSize(memberPage.getSize())
                .totalElements(memberPage.getTotalElements())
                .totalPages(memberPage.getTotalPages())
                .last(memberPage.isLast())
                .build();
    }

    /**
     * Xóa thành viên theo UUID.
     *
     * @param memberId UUID của thành viên cần xóa
     * @throws AppException nếu thành viên không tồn tại
     */
    public void deleteMember(UUID memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Set<String> roles = member.getUserRoles().stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        // Chỉ cho phép xóa user có role MEMBER
        if (!roles.contains("MEMBER")) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        userRepository.delete(member);

        log.info("DELETE_MEMBER_EVENT | memberId={} | email={} | status=SUCCESS | timestamp={}",
                memberId, member.getEmail(), java.time.LocalDateTime.now());
    }

    /**
     * Cập nhật trạng thái thành viên (ACTIVE / LOCKED).
     *
     * @param memberId UUID của thành viên cần cập nhật
     * @param status   trạng thái mới
     * @return UserResponse chứa thông tin thành viên đã cập nhật
     */
    public UserResponse updateMemberStatus(UUID memberId, String status) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        member.setStatus(status);
        User savedMember = userRepository.save(member);

        log.info("UPDATE_MEMBER_STATUS_EVENT | memberId={} | email={} | newStatus={} | timestamp={}",
                memberId, savedMember.getEmail(), status, java.time.LocalDateTime.now());

        return toUserResponse(savedMember);
    }

    /**
     * Cập nhật thông tin thành viên (không bao gồm password).
     *
     * @param memberId UUID của thành viên cần cập nhật
     * @param request DTO chứa thông tin cập nhật
     * @return UserResponse chứa thông tin thành viên đã cập nhật
     */
    public UserResponse updateMember(UUID memberId, UpdateMemberRequest request) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra email duy nhất (nếu thay đổi email)
        if (!member.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new AppException(ErrorCode.USER_EXISTED);
            }
        }

        // Cập nhật thông tin
        member.setEmail(request.getEmail().trim());
        member.setFullName(request.getFullName().trim());
        member.setDayOfBirth(request.getDayOfBirth());
        member.setGender(request.getGender().trim());
        member.setIdentityCard(request.getIdentityCard().trim());
        member.setPhoneNumber(request.getPhoneNumber().trim());
        member.setAddress(request.getAddress().trim());

        User savedMember = userRepository.save(member);

        log.info("UPDATE_MEMBER_EVENT | memberId={} | email={} | status=SUCCESS | timestamp={}",
                memberId, savedMember.getEmail(), java.time.LocalDateTime.now());

        return toUserResponse(savedMember);
    }

    // ========================
    // HELPER / MAPPER
    // ========================

    /**
     * Chuyển đổi User entity → UserResponse DTO.
     * Map roles từ Set<UserRole> thành Set<String> (tên role).
     */
    private UserResponse toUserResponse(User user) {
        Set<String> roles = user.getUserRoles().stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .uuid(user.getUuid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .dayOfBirth(user.getDayOfBirth())
                .gender(user.getGender())
                .identityCard(user.getIdentityCard())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .image(user.getImage())
                .score(user.getScore())
                .status(user.getStatus())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
