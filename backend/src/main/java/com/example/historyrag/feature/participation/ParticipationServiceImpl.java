package com.example.historyrag.feature.participation;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.event.Event;
import com.example.historyrag.feature.event.EventRepository;
import com.example.historyrag.feature.participation.dto.CreateParticipationRequest;
import com.example.historyrag.feature.participation.dto.ParticipationFilterRequest;
import com.example.historyrag.feature.participation.dto.ParticipationResponse;
import com.example.historyrag.feature.participation.dto.UpdateParticipationRequest;
import com.example.historyrag.feature.person.Person;
import com.example.historyrag.feature.person.PersonRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ParticipationServiceImpl implements ParticipationService {

    private static final String RESOURCE_NAME = "Tham gia sự kiện";

    private final ParticipationRepository participationRepository;
    private final EventRepository eventRepository;
    private final PersonRepository personRepository;

    public ParticipationServiceImpl(
            ParticipationRepository participationRepository,
            EventRepository eventRepository,
            PersonRepository personRepository) {
        this.participationRepository = participationRepository;
        this.eventRepository = eventRepository;
        this.personRepository = personRepository;
    }

    @Override
    @Transactional
    public ParticipationResponse create(CreateParticipationRequest request) {
        Event event = getEvent(request.eventId());
        Person person = getPerson(request.personId());
        validateUnique(request.eventId(), request.personId(), request.role());

        Participation participation = new Participation();
        applyCreateRequest(participation, event, person, request);
        return ParticipationResponse.fromEntity(participationRepository.save(participation));
    }

    @Override
    @Transactional
    public ParticipationResponse update(Long id, UpdateParticipationRequest request) {
        Participation participation = participationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", id));
        Event event = getEvent(request.eventId());
        Person person = getPerson(request.personId());
        validateUniqueForUpdate(id, request.eventId(), request.personId(), request.role());

        applyUpdateRequest(participation, event, person, request);
        return ParticipationResponse.fromEntity(participationRepository.save(participation));
    }

    @Override
    @Transactional(readOnly = true)
    public ParticipationResponse getById(Long id) {
        Participation participation = participationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", id));
        return ParticipationResponse.fromEntity(participation);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(ParticipationFilterRequest filter, Pageable pageable) {
        PredicateSpecification<Participation> spec = ParticipationSpecification.build(filter);
        Page<ParticipationResponse> pageResult = participationRepository.findBy(spec, q -> q.page(pageable))
                .map(ParticipationResponse::fromEntity);
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!participationRepository.existsById(id)) {
            throw new ResourceNotFoundException(RESOURCE_NAME, "id", id);
        }
        participationRepository.deleteById(id);
    }

    private Event getEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Sự kiện", "id", eventId));
    }

    private Person getPerson(Long personId) {
        return personRepository.findById(personId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân vật", "id", personId));
    }

    private void validateUnique(Long eventId, Long personId, ParticipationRole role) {
        if (participationRepository.existsByEvent_IdAndPerson_IdAndRole(eventId, personId, role)) {
            throw new DuplicateResourceException(RESOURCE_NAME, "eventId, personId, role", uniqueValue(eventId, personId, role));
        }
    }

    private void validateUniqueForUpdate(Long id, Long eventId, Long personId, ParticipationRole role) {
        if (participationRepository.existsByEvent_IdAndPerson_IdAndRoleAndIdNot(eventId, personId, role, id)) {
            throw new DuplicateResourceException(RESOURCE_NAME, "eventId, personId, role", uniqueValue(eventId, personId, role));
        }
    }

    private String uniqueValue(Long eventId, Long personId, ParticipationRole role) {
        return "eventId=%d, personId=%d, role=%s".formatted(eventId, personId, role);
    }

    private void applyCreateRequest(
            Participation participation,
            Event event,
            Person person,
            CreateParticipationRequest request) {
        participation.setEvent(event);
        participation.setPerson(person);
        participation.setRole(request.role());
        participation.setNote(request.note());
        participation.setConfidence(request.confidence());
    }

    private void applyUpdateRequest(
            Participation participation,
            Event event,
            Person person,
            UpdateParticipationRequest request) {
        participation.setEvent(event);
        participation.setPerson(person);
        participation.setRole(request.role());
        participation.setNote(request.note());
        participation.setConfidence(request.confidence());
    }
}
