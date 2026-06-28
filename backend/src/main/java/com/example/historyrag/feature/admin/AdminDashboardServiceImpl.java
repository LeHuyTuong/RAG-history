package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardActivityResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final AdminService adminService;
    private final MemberService memberService;
    private final PostService postService;
    private final EventService eventService;
    private final PersonService personService;
    private final LocationService locationService;
    private final SourceService sourceService;
    private final TagService tagService;
    private final PeriodService periodService;
    private final EngagementService engagementService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalAdmins = adminService.countAdmins();
        long totalMembers = memberService.countMembers();
        long totalPosts = postService.countPosts();
        long publishedPosts = postService.countPostsByStatus(PostStatus.PUBLISHED);
        long draftPosts = postService.countPostsByStatus(PostStatus.DRAFT);
        long archivedPosts = postService.countPostsByStatus(PostStatus.ARCHIVED);
        long totalEvents = eventService.countEvents();
        long totalPersons = personService.countPersons();
        long totalLocations = locationService.countLocations();
        long totalSources = sourceService.countSources();
        long totalTags = tagService.countTags();
        long totalPeriods = periodService.countPeriods();
        long totalEngagements = engagementService.countEngagements();
        long totalComments = engagementService.countByType(EngagementType.COMMENT);
        long pendingComments = engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.PENDING);
        long visibleComments = engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.VISIBLE);
        long hiddenComments = engagementService.countByTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.HIDDEN);

        return new DashboardResponse(
                totalAdmins,
                totalMembers,
                totalPosts,
                publishedPosts,
                draftPosts,
                archivedPosts,
                totalEvents,
                totalPersons,
                totalLocations,
                totalSources,
                totalTags,
                totalPeriods,
                totalEngagements,
                totalComments,
                pendingComments,
                visibleComments,
                hiddenComments,
                buildActivities(draftPosts, pendingComments, totalMembers, totalSources)
        );
    }

    private List<DashboardActivityResponse> buildActivities(
            long draftPosts,
            long pendingComments,
            long totalMembers,
            long totalSources) {
        List<DashboardActivityResponse> activities = new ArrayList<>();
        if (pendingComments > 0) {
            activities.add(new DashboardActivityResponse(
                    "pending-comments",
                    "forum",
                    "text-amber-700",
                    "bg-amber-100",
                    "Có " + pendingComments + " bình luận đang chờ duyệt",
                    "Cần xử lý"
            ));
        }
        if (draftPosts > 0) {
            activities.add(new DashboardActivityResponse(
                    "draft-posts",
                    "edit_note",
                    "text-primary",
                    "bg-primary/10",
                    "Có " + draftPosts + " bài viết nháp trong hệ thống",
                    "Biên tập"
            ));
        }
        activities.add(new DashboardActivityResponse(
                "member-total",
                "group",
                "text-on-surface",
                "bg-accent/10",
                "Cộng đồng hiện có " + totalMembers + " thành viên",
                "Hiện tại"
        ));
        activities.add(new DashboardActivityResponse(
                "source-total",
                "auto_stories",
                "text-primary",
                "bg-surface-variant",
                "Kho sử liệu đang lưu " + totalSources + " nguồn tham khảo",
                "Dữ liệu"
        ));
        return activities;
    }
}
