package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardActivityResponse;
import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.engagement.CommentStatus;
import com.example.historyrag.feature.engagement.EngagementRepository;
import com.example.historyrag.feature.engagement.EngagementType;
import com.example.historyrag.feature.event.EventRepository;
import com.example.historyrag.feature.location.LocationRepository;
import com.example.historyrag.feature.period.PeriodRepository;
import com.example.historyrag.feature.person.PersonRepository;
import com.example.historyrag.feature.post.PostRepository;
import com.example.historyrag.feature.post.PostStatus;
import com.example.historyrag.feature.source.SourceRepository;
import com.example.historyrag.feature.tag.TagRepository;
import com.example.historyrag.feature.user.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final AdminRepository adminRepository;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;
    private final EventRepository eventRepository;
    private final PersonRepository personRepository;
    private final LocationRepository locationRepository;
    private final SourceRepository sourceRepository;
    private final TagRepository tagRepository;
    private final PeriodRepository periodRepository;
    private final EngagementRepository engagementRepository;

    public AdminDashboardServiceImpl(
            AdminRepository adminRepository,
            MemberRepository memberRepository,
            PostRepository postRepository,
            EventRepository eventRepository,
            PersonRepository personRepository,
            LocationRepository locationRepository,
            SourceRepository sourceRepository,
            TagRepository tagRepository,
            PeriodRepository periodRepository,
            EngagementRepository engagementRepository) {
        this.adminRepository = adminRepository;
        this.memberRepository = memberRepository;
        this.postRepository = postRepository;
        this.eventRepository = eventRepository;
        this.personRepository = personRepository;
        this.locationRepository = locationRepository;
        this.sourceRepository = sourceRepository;
        this.tagRepository = tagRepository;
        this.periodRepository = periodRepository;
        this.engagementRepository = engagementRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalAdmins = adminRepository.count();
        long totalMembers = memberRepository.count();
        long totalPosts = postRepository.count();
        long publishedPosts = postRepository.countByStatus(PostStatus.PUBLISHED);
        long draftPosts = postRepository.countByStatus(PostStatus.DRAFT);
        long archivedPosts = postRepository.countByStatus(PostStatus.ARCHIVED);
        long totalEvents = eventRepository.count();
        long totalPersons = personRepository.count();
        long totalLocations = locationRepository.count();
        long totalSources = sourceRepository.count();
        long totalTags = tagRepository.count();
        long totalPeriods = periodRepository.count();
        long totalEngagements = engagementRepository.count();
        long totalComments = engagementRepository.countByEngagementType(EngagementType.COMMENT);
        long pendingComments = engagementRepository.countByEngagementTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.PENDING);
        long visibleComments = engagementRepository.countByEngagementTypeAndCommentStatus(
                EngagementType.COMMENT, CommentStatus.VISIBLE);
        long hiddenComments = engagementRepository.countByEngagementTypeAndCommentStatus(
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
