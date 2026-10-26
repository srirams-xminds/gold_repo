package com.example.goldmarket.repository;

import com.example.goldmarket.model.PriceTrigger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceTriggerRepository extends JpaRepository<PriceTrigger, Long> {
    List<PriceTrigger> findByUserIdAndStatus(Long userId, PriceTrigger.Status status);
    List<PriceTrigger> findByStatus(PriceTrigger.Status status);
    List<PriceTrigger> findByUserIdOrderByCreatedAtDesc(Long userId);
}
