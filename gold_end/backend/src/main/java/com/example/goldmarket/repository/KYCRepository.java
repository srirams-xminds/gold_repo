package com.example.goldmarket.repository;

import com.example.goldmarket.model.KYC;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KYCRepository extends JpaRepository<KYC, Long> {
    Optional<KYC> findByUserId(Long userId);
    List<KYC> findByStatus(KYC.Status status);
    boolean existsByUserId(Long userId);
}
