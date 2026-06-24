package com.cinema.cinemate.repository;

import com.cinema.cinemate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query(value = "SELECT u.* FROM users u " +
           "JOIN user_roles ur ON u.uuid = ur.user_uuid " +
           "JOIN roles r ON ur.role_uuid = r.uuid " +
           "WHERE r.name IN ('STAFF', 'MANAGER') " +
           "AND (:search IS NULL OR " +
           "     unaccent(lower(u.username)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.full_name)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.email)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.phone_number)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%')))) " +
           "AND (:role IS NULL OR r.name = :role)",
           countQuery = "SELECT count(u.uuid) FROM users u " +
           "JOIN user_roles ur ON u.uuid = ur.user_uuid " +
           "JOIN roles r ON ur.role_uuid = r.uuid " +
           "WHERE r.name IN ('STAFF', 'MANAGER') " +
           "AND (:search IS NULL OR " +
           "     unaccent(lower(u.username)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.full_name)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.email)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.phone_number)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%')))) " +
           "AND (:role IS NULL OR r.name = :role)",
           nativeQuery = true)
    Page<User> findEmployeesWithFilters(
            @Param("search") String search,
            @Param("role") String role,
            Pageable pageable
    );

    @Query(value = "SELECT u.* FROM users u " +
           "JOIN user_roles ur ON u.uuid = ur.user_uuid " +
           "JOIN roles r ON ur.role_uuid = r.uuid " +
           "WHERE r.name = 'MEMBER' " +
           "AND (:search IS NULL OR " +
           "     unaccent(lower(u.username)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.full_name)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.email)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.phone_number)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%')))) " +
           "AND (:status IS NULL OR u.status = :status)",
           countQuery = "SELECT count(u.uuid) FROM users u " +
           "JOIN user_roles ur ON u.uuid = ur.user_uuid " +
           "JOIN roles r ON ur.role_uuid = r.uuid " +
           "WHERE r.name = 'MEMBER' " +
           "AND (:search IS NULL OR " +
           "     unaccent(lower(u.username)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.full_name)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.email)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%'))) OR " +
           "     unaccent(lower(u.phone_number)) ILIKE unaccent(lower(concat('%', cast(:search as varchar), '%')))) " +
           "AND (:status IS NULL OR u.status = :status)",
           nativeQuery = true)
    Page<User> findMembersWithFilters(
            @Param("search") String search,
            @Param("status") String status,
            Pageable pageable
    );
}
