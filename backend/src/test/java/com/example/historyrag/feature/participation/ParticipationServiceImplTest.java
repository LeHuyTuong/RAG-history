package com.example.historyrag.feature.participation;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.event.EventService;
import com.example.historyrag.feature.participation.dto.CreateParticipationRequest;
import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import com.example.historyrag.feature.participation.dto.ParticipationResponse;
import com.example.historyrag.feature.participation.dto.UpdateParticipationRequest;
import com.example.historyrag.feature.person.Person;
import com.example.historyrag.feature.person.PersonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceImplTest {

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private EventService eventService;

    @Mock
    private PersonService personService;

    private ParticipationServiceImpl participationService;

    @BeforeEach
    void setUp() {
        participationService = new ParticipationServiceImpl(
                participationRepository,
                eventService,
                personService);
    }

    @Test
    @DisplayName("Should create participation when event person role combination is unique")
    void create_uniqueCombination_returnsParticipationResponse() {
        CreateParticipationRequest request = createRequest(ParticipationRole.GENERAL);
        mockRelatedEntities(request.eventId(), request.personId());
        when(participationRepository.existsByEvent_IdAndPerson_IdAndRole(1L, 2L, ParticipationRole.GENERAL)).thenReturn(false);
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> {
            Participation saved = invocation.getArgument(0);
            saved.setId(10L);
            saved.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
            return saved;
        });

        ParticipationResponse response = participationService.create(request);

        assertEquals(10L, response.id());
        assertEquals("Kháng chiến Mông Nguyên", response.event().name());
        assertEquals("Trần Hưng Đạo", response.person().name());
        assertEquals(ParticipationRole.GENERAL, response.role());
    }

    @Test
    @DisplayName("Should allow null role when creating participation")
    void create_nullRole_storesNullRole() {
        CreateParticipationRequest request = createRequest(null);
        mockRelatedEntities(request.eventId(), request.personId());
        when(participationRepository.existsByEvent_IdAndPerson_IdAndRole(1L, 2L, null)).thenReturn(false);
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> {
            Participation saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        ParticipationResponse response = participationService.create(request);

        assertNull(response.role());
    }

    @Test
    @DisplayName("Should reject create when event person role combination already exists")
    void create_duplicateCombination_throwsDuplicateResourceException() {
        CreateParticipationRequest request = createRequest(ParticipationRole.GENERAL);
        mockRelatedEntities(request.eventId(), request.personId());
        when(participationRepository.existsByEvent_IdAndPerson_IdAndRole(1L, 2L, ParticipationRole.GENERAL)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> participationService.create(request));

        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    @DisplayName("Should reject create when event does not exist")
    void create_missingEvent_throwsResourceNotFoundException() {
        CreateParticipationRequest request = createRequest(ParticipationRole.GENERAL);
        when(eventService.getEventEntityById(request.eventId()))
                .thenThrow(new ResourceNotFoundException("Sự kiện", "id", request.eventId()));

        assertThrows(ResourceNotFoundException.class, () -> participationService.create(request));

        verify(personService, never()).getPersonEntityById(any());
        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    @DisplayName("Should reject create when person does not exist")
    void create_missingPerson_throwsResourceNotFoundException() {
        CreateParticipationRequest request = createRequest(ParticipationRole.GENERAL);
        when(eventService.getEventEntityById(request.eventId())).thenReturn(event());
        when(personService.getPersonEntityById(request.personId()))
                .thenThrow(new ResourceNotFoundException("Nhân vật", "id", request.personId()));

        assertThrows(ResourceNotFoundException.class, () -> participationService.create(request));

        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    @DisplayName("Should update participation when it exists")
    void update_existingParticipation_returnsUpdatedParticipationResponse() {
        Participation participation = participation(10L, ParticipationRole.GENERAL);
        UpdateParticipationRequest request = updateRequest(ParticipationRole.COMMANDER);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        mockRelatedEntities(request.eventId(), request.personId());
        when(participationRepository.existsByEvent_IdAndPerson_IdAndRoleAndIdNot(1L, 2L, ParticipationRole.COMMANDER, 10L))
                .thenReturn(false);
        when(participationRepository.save(participation)).thenReturn(participation);

        ParticipationResponse response = participationService.update(participation.getId(), request);

        assertEquals(ParticipationRole.COMMANDER, response.role());
        assertEquals("Tổng chỉ huy", response.note());
        assertEquals(new BigDecimal("0.99"), response.confidence());
    }

    @Test
    @DisplayName("Should reject update when participation does not exist")
    void update_missingParticipation_throwsResourceNotFoundException() {
        UpdateParticipationRequest request = updateRequest(ParticipationRole.COMMANDER);
        when(participationRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> participationService.update(404L, request));
    }

    @Test
    @DisplayName("Should reject update when event person role combination already exists")
    void update_duplicateCombination_throwsDuplicateResourceException() {
        Participation participation = participation(10L, ParticipationRole.GENERAL);
        UpdateParticipationRequest request = updateRequest(ParticipationRole.COMMANDER);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));
        mockRelatedEntities(request.eventId(), request.personId());
        when(participationRepository.existsByEvent_IdAndPerson_IdAndRoleAndIdNot(1L, 2L, ParticipationRole.COMMANDER, 10L))
                .thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> participationService.update(10L, request));

        verify(participationRepository, never()).save(any(Participation.class));
    }

    @Test
    @DisplayName("Should return participation detail by id")
    void getById_existingParticipation_returnsParticipationResponse() {
        Participation participation = participation(10L, ParticipationRole.GENERAL);
        when(participationRepository.findById(participation.getId())).thenReturn(Optional.of(participation));

        ParticipationResponse response = participationService.getById(participation.getId());

        assertEquals(10L, response.id());
        assertEquals("tran-hung-dao", response.person().slug());
    }

    @Test
    @DisplayName("Should reject get by id when participation does not exist")
    void getById_missingParticipation_throwsResourceNotFoundException() {
        when(participationRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> participationService.getById(404L));
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering participations")
    @SuppressWarnings({"unchecked", "rawtypes"})
    void filter_existingParticipations_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        PageImpl<Participation> page = new PageImpl<>(List.of(participation(10L, ParticipationRole.GENERAL)), pageable, 1);
        when(participationRepository.findBy(any(PredicateSpecification.class), any(Function.class))).thenReturn(page);

        ResultPaginationDTO result = participationService.filter(
                new ParticipationFilterRequest(1L, 2L, ParticipationRole.GENERAL),
                pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete participation when it exists")
    void delete_existingParticipation_deletesById() {
        when(participationRepository.existsById(10L)).thenReturn(true);

        participationService.delete(10L);

        verify(participationRepository).deleteById(10L);
    }

    @Test
    @DisplayName("Should reject delete when participation does not exist")
    void delete_missingParticipation_throwsResourceNotFoundException() {
        when(participationRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> participationService.delete(404L));
    }

    private void mockRelatedEntities(Long eventId, Long personId) {
        when(eventService.getEventEntityById(eventId)).thenReturn(event());
        when(personService.getPersonEntityById(personId)).thenReturn(person());
    }

    private CreateParticipationRequest createRequest(ParticipationRole role) {
        return new CreateParticipationRequest(
                1L,
                2L,
                role,
                "Chỉ huy quân đội",
                new BigDecimal("0.95")
        );
    }

    private UpdateParticipationRequest updateRequest(ParticipationRole role) {
        return new UpdateParticipationRequest(
                1L,
                2L,
                role,
                "Tổng chỉ huy",
                new BigDecimal("0.99")
        );
    }

    private Participation participation(Long id, ParticipationRole role) {
        Participation participation = new Participation();
        participation.setId(id);
        participation.setEvent(event());
        participation.setPerson(person());
        participation.setRole(role);
        participation.setNote("Chỉ huy quân đội");
        participation.setConfidence(new BigDecimal("0.95"));
        participation.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
        participation.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
        return participation;
    }

    private Event event() {
        Event event = new Event();
        event.setId(1L);
        event.setName("Kháng chiến Mông Nguyên");
        event.setSlug("khang-chien-mong-nguyen");
        return event;
    }

    private Person person() {
        Person person = new Person();
        person.setId(2L);
        person.setName("Trần Hưng Đạo");
        person.setSlug("tran-hung-dao");
        return person;
    }
}
