package com.example.historyrag;

import com.example.historyrag.feature.person.PersonRepository;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;

@Disabled("manual debug test — requires live DB")
@SpringBootTest
class PersonFetchTest {

    @Autowired
    private PersonRepository personRepository;

    @Test
    void testFetch() {
        try {
            var page = personRepository.findAll(PageRequest.of(0, 500));
            System.out.println("Fetched: " + page.getTotalElements());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
