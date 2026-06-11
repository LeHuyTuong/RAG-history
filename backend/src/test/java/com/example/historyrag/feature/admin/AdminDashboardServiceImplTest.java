package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.engagement.EngagementRepository;
import com.example.historyrag.feature.event.EventRepository;
import com.example.historyrag.feature.location.LocationRepository;
import com.example.historyrag.feature.period.PeriodRepository;
import com.example.historyrag.feature.person.PersonRepository;
import com.example.historyrag.feature.post.PostRepository;
import com.example.historyrag.feature.source.SourceRepository;
import com.example.historyrag.feature.tag.TagRepository;
import com.example.historyrag.feature.user.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private SourceRepository sourceRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private PeriodRepository periodRepository;

    @Mock
    private EngagementRepository engagementRepository;

    private AdminDashboardServiceImpl adminDashboardService;

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardServiceImpl(
                adminRepository,
                memberRepository,
                postRepository,
                eventRepository,
                personRepository,
                locationRepository,
                sourceRepository,
                tagRepository,
                periodRepository,
                engagementRepository);
    }

    @Test
    @DisplayName("Should return dashboard counts from Spring Data JPA repositories")
    void getDashboard_existingData_returnsDashboardSummary() {
        when(adminRepository.count()).thenReturn(2L);
        when(memberRepository.count()).thenReturn(40L);
        when(postRepository.count()).thenReturn(12L);
        when(postRepository.countByStatus("PUBLISHED")).thenReturn(8L);
        when(postRepository.countByStatus("DRAFT")).thenReturn(3L);
        when(postRepository.countByStatus("ARCHIVED")).thenReturn(1L);
        when(eventRepository.count()).thenReturn(6L);
        when(personRepository.count()).thenReturn(9L);
        when(locationRepository.count()).thenReturn(5L);
        when(sourceRepository.count()).thenReturn(11L);
        when(tagRepository.count()).thenReturn(7L);
        when(periodRepository.count()).thenReturn(4L);
        when(engagementRepository.count()).thenReturn(100L);
        when(engagementRepository.countByEngagementType("COMMENT")).thenReturn(20L);
        when(engagementRepository.countByEngagementTypeAndCommentStatus("COMMENT", "PENDING"))
                .thenReturn(2L);
        when(engagementRepository.countByEngagementTypeAndCommentStatus("COMMENT", "VISIBLE"))
                .thenReturn(17L);
        when(engagementRepository.countByEngagementTypeAndCommentStatus("COMMENT", "HIDDEN"))
                .thenReturn(1L);

        DashboardResponse response = adminDashboardService.getDashboard();

        assertEquals(2L, response.totalAdmins());
        assertEquals(40L, response.totalMembers());
        assertEquals(12L, response.totalPosts());
        assertEquals(8L, response.publishedPosts());
        assertEquals(3L, response.draftPosts());
        assertEquals(2L, response.pendingComments());
        assertEquals(17L, response.visibleComments());
        assertEquals(1L, response.hiddenComments());
        assertFalse(response.activities().isEmpty());
    }
}
