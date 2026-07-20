package com.example.historyrag.feature.participation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ParticipationRepository extends JpaRepository<Participation, Long>, JpaSpecificationExecutor<Participation> {

    boolean existsByEvent_IdAndPerson_IdAndRole(Long eventId, Long personId, ParticipationRole role);

    boolean existsByEvent_IdAndPerson_IdAndRoleAndIdNot(Long eventId, Long personId, ParticipationRole role, Long id);
    java.util.List<Participation> findByEvent_EventLocations_Location_Id(Long locationId);
}
