import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

export type EventCarouselCard = {
  id: number;
  category: string;
  title: string;
  src: string;
  alt: string;
  venue: string;
  detail?: string;
  color: string;
};

/** Horizontal poster strip based on the supplied carousel-08 layout. */
export default function AppleCardCarousel({ cards, onOpen }: {
  cards: EventCarouselCard[];
  onOpen: (eventId: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  if (!cards.length) return null;

  return (
    <div className="feed-event-carousel" onClick={event => event.stopPropagation()}>
      <Carousel setApi={setApi} opts={{ align: "start", dragFree: true }} className="feed-event-carousel__track">
        <CarouselContent className="feed-event-carousel__content">
          {cards.map(card => (
            <CarouselItem key={card.id} className="feed-event-carousel__item">
              <button type="button" className="feed-event-carousel__card" style={{ borderColor: card.color }} onClick={() => onOpen(card.id)} aria-label={`Open ${card.title}${card.venue ? ` at ${card.venue}` : ""}`}>
                <img src={card.src} alt={card.alt} loading="lazy" decoding="async" />
                <span className="feed-event-carousel__shade" aria-hidden="true" />
                <span className="feed-event-carousel__copy">
                  <span className="feed-event-carousel__category" style={{ color: card.color }}>{card.category}</span>
                  <span className="feed-event-carousel__title">{card.title}</span>
                  <span className="feed-event-carousel__venue">{card.venue}{card.detail ? ` · ${card.detail}` : ""}</span>
                </span>
                <span className="feed-event-carousel__open" aria-hidden="true"><ArrowUpRight size={17} /></span>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {cards.length > 1 && (
        <div className="feed-event-carousel__controls">
          <span className="feed-event-carousel__count">{cards.length} events</span>
          <Button type="button" variant="outline" size="icon" className="feed-event-carousel__nav" onClick={() => api?.scrollPrev()} disabled={!canScrollPrev} aria-label="Previous events"><ArrowLeft size={16} /></Button>
          <Button type="button" variant="outline" size="icon" className="feed-event-carousel__nav" onClick={() => api?.scrollNext()} disabled={!canScrollNext} aria-label="Next events"><ArrowRight size={16} /></Button>
        </div>
      )}
    </div>
  );
}
