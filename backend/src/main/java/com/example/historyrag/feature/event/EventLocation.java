package com.example.historyrag.feature.event;

import com.example.historyrag.feature.location.Location;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "event_location")
public class EventLocation {

    @EmbeddedId
    private EventLocationId id = new EventLocationId();

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("eventId")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("locationId")
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "location_id", nullable = false)
    private Location location;

    @Size(max = 50)
    @Column(name = "relation_type", length = 50)
    private String relationType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public EventLocation(Event event, Location location, String relationType) {
        this.event = event;
        this.location = location;
        this.relationType = relationType;
        this.id = new EventLocationId(
                event != null ? event.getId() : null,
                location != null ? location.getId() : null
        );
    }
}
