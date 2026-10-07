"use client";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";

export type CalEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: "PLANNED" | "DONE" | "MISSED";
};

const COLORS = { PLANNED: "#4f46e5", DONE: "#059669", MISSED: "#dc2626" };

export default function WeekCalendar({ events }: { events: CalEvent[] }) {
  return (
    <FullCalendar
      plugins={[timeGridPlugin, dayGridPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "timeGridWeek,timeGridDay,dayGridMonth",
      }}
      slotMinTime="06:00:00"
      slotMaxTime="23:00:00"
      nowIndicator
      height="auto"
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        backgroundColor: COLORS[e.status],
        borderColor: COLORS[e.status],
      }))}
    />
  );
}