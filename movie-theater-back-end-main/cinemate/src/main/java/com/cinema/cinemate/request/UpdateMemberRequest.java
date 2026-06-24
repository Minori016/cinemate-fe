package com.cinema.cinemate.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

/**
 * DTO nhận dữ liệu cập nhật thông tin thành viên từ Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMemberRequest {

    /** Họ và tên */
    @NotBlank(message = "FULLNAME_REQUIRED")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    /** Ngày sinh */
    @NotNull(message = "BIRTHDAY_REQUIRED")
    private LocalDate dayOfBirth;

    /** Giới tính (Male / Female / Other) */
    @NotBlank(message = "GENDER_REQUIRED")
    private String gender;

    /** Số CMND / CCCD */
    @NotBlank(message = "IDENTITY_CARD_REQUIRED")
    @Size(max = 20, message = "Identity card must not exceed 20 characters")
    private String identityCard;

    /** Email */
    @NotBlank(message = "EMAIL_REQUIRED")
    @Email(message = "INVALID_EMAIL")
    private String email;

    /** Số điện thoại */
    @NotBlank(message = "PHONE_REQUIRED")
    @Size(max = 15, message = "Phone number must not exceed 15 characters")
    private String phoneNumber;

    /** Địa chỉ */
    @NotBlank(message = "ADDRESS_REQUIRED")
    @Size(max = 200, message = "Address must not exceed 200 characters")
    private String address;
}
