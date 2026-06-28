package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.engagement.CommentStatus;
import com.example.historyrag.feature.engagement.EngagementService;
import com.example.historyrag.feature.engagement.EngagementType;
import com.example.historyrag.feature.event.EventService;
import com.example.historyrag.feature.location.LocationService;
import com.example.historyrag.feature.period.PeriodService;
import com.example.historyrag.feature.person.PersonService;
import com.example.historyrag.feature.post.PostService;
import com.example.historyrag.feature.post.PostStatus;
import com.example.historyrag.feature.source.SourceService;
import com.example.historyrag.feature.tag.TagService;
import com.example.historyrag.feature.user.MemberService;
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
    private AdminService adminService;

    @Mock
    private MemberService memberService;

    @Mock
    private PostService postService;

    @Mock
    private EventService eventService;

    @Mock
    private PersonService personService;

    @Mock
    private LocationService locationService;

    @Mock
    private SourceService sourceService;

    @Mock
    private TagService tagService;

    @Mock
    private PeriodService periodService;

    @Mock
    private EngagementService engagementService;

    private AdminDashboardServiceImpl adminDashboardService;

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardServiceImpl(
                adminService,
                memberService,
                postService,
                eventService,
                personService,
                locationService,
                sourceService,
                tagService,
                periodService,
                engagementService);
    }

    @Test
    @DisplayName("Should return dashboard counts from feature services")
    void getDashboard_existingData_returnsDashboardSummary() {
        when(adminService.countAdmins()).thenReturn(2L);
        when(memberService.countMembers()).thenReturn(40L);
        when(postService.countPosts()).thenReturn(12L);
        when(postService.countPostsByStatus(PostStatus.PUBLISHED)).thenReturn(8L);
        when(postService.countPostsByStatus(PostStatus.DRAFT)).thenReturn(3L);
        when(postService.countPostsByStatus(PostStatus.ARCHIVED)).thenReturn(1L);
        when(eventService.countEvents()).thenReturn(6L);
        when(personService.countPersons()).thenReturn(9L);
        when(locationService.countLocations()).thenReturn(5L);
        when(sourceService.countSources()).thenReturn(11L);
        when(tagService.countTags()).thenReturn(7L);
        when(periodService.countPeriods()).thenReturn(4L);
        when(engagementService.countEngagements()).thenReturn(100L);
        when(engagementService.countByType(EngagementType.COMMENT)).thenReturn(20L);
        when(engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.PENDING))
                .thenReturn(2L);
        when(engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.VISIBLE))
                .thenReturn(17L);
        when(engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.HIDDEN))
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
