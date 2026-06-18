package com.example.historyrag.feature.person;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.person.dto.PersonRequest;
import com.example.historyrag.feature.person.dto.PersonResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PersonServiceImpl implements PersonService {

    private final PersonRepository personRepository;

    public PersonServiceImpl(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    @Override
    @Transactional
    public PersonResponse createPerson(PersonRequest request) {
        if (personRepository.existsBySlug(request.slug())) {
            throw new DuplicateResourceException("Nhân vật", "slug", request.slug());
        }

        Person person = new Person();
        applyRequest(person, request);
        return PersonResponse.fromEntity(personRepository.save(person));
    }

    @Override
    @Transactional
    public PersonResponse updatePerson(Long id, PersonRequest request) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân vật", "id", id));

        if (!person.getSlug().equals(request.slug()) && personRepository.existsBySlugAndIdNot(request.slug(), id)) {
            throw new DuplicateResourceException("Nhân vật", "slug", request.slug());
        }

        applyRequest(person, request);
        return PersonResponse.fromEntity(personRepository.save(person));
    }

    @Override
    @Transactional(readOnly = true)
    public PersonResponse getById(Long id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhân vật", "id", id));
        return PersonResponse.fromEntity(person);
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO getAllPersons(String keyword, Pageable pageable) {
        Page<Person> persons;
        if (keyword != null && !keyword.isBlank()) {
            persons = personRepository.findByNameContainingIgnoreCase(keyword, pageable);
        } else {
            persons = personRepository.findAll(pageable);
        }
        return ResultPaginationDTO.fromPage(persons.map(PersonResponse::fromEntity));
    }

    @Override
    @Transactional
    public void deletePerson(Long id) {
        if (!personRepository.existsById(id)) {
            throw new ResourceNotFoundException("Nhân vật", "id", id);
        }
        personRepository.deleteById(id);
    }

    private void applyRequest(Person person, PersonRequest request) {
        person.setName(request.name());
        person.setSlug(request.slug());
        person.setAlias(request.alias());
        person.setBirthDate(request.birthDate());
        person.setDeathDate(request.deathDate());
        person.setBiography(request.biography());
    }
}
