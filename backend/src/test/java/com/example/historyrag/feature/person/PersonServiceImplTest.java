package com.example.historyrag.feature.person;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.person.dto.PersonRequest;
import com.example.historyrag.feature.person.dto.PersonResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonServiceImplTest {

    @Mock
    private PersonRepository personRepository;

    private PersonServiceImpl personService;

    @BeforeEach
    void setUp() {
        personService = new PersonServiceImpl(personRepository);
    }

    @Test
    @DisplayName("Should create person when slug is unique")
    void createPerson_uniqueSlug_returnsPersonResponse() {
        PersonRequest request = personRequest("ngo-quyen");
        when(personRepository.existsBySlug(request.slug())).thenReturn(false);
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> {
            Person saved = invocation.getArgument(0);
            saved.setId(1L);
            saved.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
            saved.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
            return saved;
        });

        PersonResponse response = personService.createPerson(request);

        assertEquals(1L, response.id());
        assertEquals("Ngô Quyền", response.name());
        assertEquals("Tiền Ngô Vương", response.alias());
        assertEquals(LocalDate.of(944, 1, 1), response.deathDate());
    }

    @Test
    @DisplayName("Should reject create when slug already exists")
    void createPerson_duplicateSlug_throwsDuplicateResourceException() {
        PersonRequest request = personRequest("ngo-quyen");
        when(personRepository.existsBySlug(request.slug())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> personService.createPerson(request));

        verify(personRepository, never()).save(any(Person.class));
    }

    @Test
    @DisplayName("Should update person when it exists")
    void updatePerson_existingPerson_returnsUpdatedPersonResponse() {
        Person person = person(1L, "ngo-quyen");
        PersonRequest request = updateRequest("duc-vuong-ngo-quyen");
        when(personRepository.findById(person.getId())).thenReturn(Optional.of(person));
        when(personRepository.existsBySlugAndIdNot(request.slug(), person.getId())).thenReturn(false);
        when(personRepository.save(person)).thenReturn(person);

        PersonResponse response = personService.updatePerson(person.getId(), request);

        assertEquals("Đức Vương Ngô Quyền", response.name());
        assertEquals("duc-vuong-ngo-quyen", response.slug());
        assertEquals("Vua mở đầu thời kỳ độc lập tự chủ", response.biography());
    }

    @Test
    @DisplayName("Should reject update when person does not exist")
    void updatePerson_missingPerson_throwsResourceNotFoundException() {
        PersonRequest request = updateRequest("missing");
        when(personRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> personService.updatePerson(404L, request));
    }

    @Test
    @DisplayName("Should reject update when slug already exists on another person")
    void updatePerson_duplicateSlug_throwsDuplicateResourceException() {
        Person person = person(1L, "ngo-quyen");
        PersonRequest request = updateRequest("le-loi");
        when(personRepository.findById(person.getId())).thenReturn(Optional.of(person));
        when(personRepository.existsBySlugAndIdNot(request.slug(), person.getId())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> personService.updatePerson(person.getId(), request));

        verify(personRepository, never()).save(any(Person.class));
    }

    @Test
    @DisplayName("Should return person detail by id")
    void getById_existingPerson_returnsPersonResponse() {
        Person person = person(1L, "ngo-quyen");
        when(personRepository.findById(person.getId())).thenReturn(Optional.of(person));

        PersonResponse response = personService.getById(person.getId());

        assertEquals(person.getId(), response.id());
        assertEquals(person.getSlug(), response.slug());
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO when filtering persons")
    void getAllPersons_existingPersons_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Person person = person(1L, "ngo-quyen");
        PageImpl<Person> page = new PageImpl<>(List.of(person), pageable, 1);
        when(personRepository.findByNameContainingIgnoreCase("ngo", pageable)).thenReturn(page);

        ResultPaginationDTO result = personService.getAllPersons("ngo", pageable);

        assertEquals(1, result.meta().page());
        assertEquals(10, result.meta().pageSize());
        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should return ResultPaginationDTO for all persons when keyword is blank")
    void getAllPersons_blankKeyword_returnsPaginationDTO() {
        PageRequest pageable = PageRequest.of(0, 10);
        Person person = person(1L, "ngo-quyen");
        PageImpl<Person> page = new PageImpl<>(List.of(person), pageable, 1);
        when(personRepository.findAll(pageable)).thenReturn(page);

        ResultPaginationDTO result = personService.getAllPersons(" ", pageable);

        assertEquals(1, result.meta().total());
        assertEquals(1, result.result().size());
    }

    @Test
    @DisplayName("Should delete person when it exists")
    void deletePerson_existingPerson_deletesById() {
        when(personRepository.existsById(1L)).thenReturn(true);

        personService.deletePerson(1L);

        verify(personRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should reject delete when person does not exist")
    void deletePerson_missingPerson_throwsResourceNotFoundException() {
        when(personRepository.existsById(404L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> personService.deletePerson(404L));
    }

    private PersonRequest personRequest(String slug) {
        return new PersonRequest(
                "Ngô Quyền",
                slug,
                "Tiền Ngô Vương",
                LocalDate.of(898, 1, 1),
                LocalDate.of(944, 1, 1),
                "Vị vua đặt nền móng cho nền độc lập lâu dài"
        );
    }

    private PersonRequest updateRequest(String slug) {
        return new PersonRequest(
                "Đức Vương Ngô Quyền",
                slug,
                "Tiền Ngô Vương",
                LocalDate.of(898, 1, 1),
                LocalDate.of(944, 1, 1),
                "Vua mở đầu thời kỳ độc lập tự chủ"
        );
    }

    private Person person(Long id, String slug) {
        Person person = new Person();
        person.setId(id);
        person.setName("Ngô Quyền");
        person.setSlug(slug);
        person.setAlias("Tiền Ngô Vương");
        person.setBirthDate(LocalDate.of(898, 1, 1));
        person.setDeathDate(LocalDate.of(944, 1, 1));
        person.setBiography("Vị vua đặt nền móng cho nền độc lập lâu dài");
        person.setCreatedAt(Instant.parse("2026-06-16T00:00:00Z"));
        person.setUpdatedAt(Instant.parse("2026-06-16T01:00:00Z"));
        return person;
    }
}
