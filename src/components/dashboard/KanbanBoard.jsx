import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { LEAD_STATUSES } from "@/lib/plans";
import LeadCard from "@/components/leads/LeadCard";

export default function KanbanBoard({ leads, onMove, onLeadClick }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    if (newStatus !== result.source.droppableId) {
      onMove(result.draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
        {LEAD_STATUSES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          const total = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
          return (
            <div key={stage.key} className="w-[270px] shrink-0">
              <div className="flex items-center justify-between px-1 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                  <span className="font-heading text-sm font-semibold">{stage.label}</span>
                  <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{stageLeads.length}</span>
                </div>
                {total > 0 && <span className="text-[11px] font-medium text-muted-foreground">${total.toLocaleString()}</span>}
              </div>
              <Droppable droppableId={stage.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2.5 rounded-2xl p-2 min-h-[200px] transition-colors duration-200 ${
                      snapshot.isDraggingOver ? "bg-accent" : "bg-secondary/50"
                    }`}
                  >
                    {stageLeads.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(p, snap) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className={snap.isDragging ? "rotate-2" : ""}
                          >
                            <LeadCard lead={lead} onClick={() => onLeadClick(lead)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
