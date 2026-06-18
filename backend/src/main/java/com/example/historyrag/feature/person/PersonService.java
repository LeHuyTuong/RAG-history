package com.example.historyrag.feature.person;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.person.dto.PersonRequest;
import com.example.historyrag.feature.person.dto.PersonResponse;
import org.springframework.data.domain.Pageable;

public interface PersonService {

    PersonResponse createPerson(PersonRequest request);

    PersonResponse updatePerson(Long id, PersonRequest request);

    PersonResponse getById(Long id);

    ResultPaginationDTO getAllPersons(String keyword, Pageable pageable);

    void deletePerson(Long id);
}
