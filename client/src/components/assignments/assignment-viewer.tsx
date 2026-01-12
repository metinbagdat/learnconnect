import { useQuery } from "@tanstack/react-query";
import { Assignment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle, CheckCircle, ListTodo } from "lucide-react";
import { format } from "date-fns";
import { ToDoList } from "./todo-list";

interface AssignmentViewerProps {
  courseId: number;
  studentId?: number;
  showAsTodo?: boolean;
}

export function AssignmentViewer({ courseId, studentId, showAsTodo = false }: AssignmentViewerProps) {
  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: [`/api/courses/${courseId}/assignments`],
  });

  if (isLoading) {
    return <div data-testid="loading">Loading assignments...</div>;
  }

  // Use ToDoList view if requested
  if (showAsTodo) {
    return <ToDoList courseId={courseId} />;
  }

  if (assignments.length === 0) {
    return (
      <Card data-testid="no-assignments" className="border-dashed">
        <CardContent className="pt-6 text-center">
          <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="font-semibold">You're all caught up!</p>
          <p className="text-sm text-muted-foreground">No pending assignments at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="assignment-viewer">
      {assignments.map((assignment) => {
        const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
        const daysUntilDue = assignment.dueDate
          ? Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return (
          <Card key={assignment.id} data-testid={`card-assignment-${assignment.id}`} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg" data-testid={`title-${assignment.id}`}>
                    {assignment.title}
                  </CardTitle>
                  <CardDescription data-testid={`description-${assignment.id}`}>
                    {assignment.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={isOverdue ? "destructive" : assignment.status === "completed" ? "default" : "secondary"}
                  data-testid={`status-${assignment.id}`}
                  className="ml-2"
                >
                  {isOverdue ? "Overdue" : assignment.status === "completed" ? "Completed" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Details */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Points */}
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="text-2xl font-bold" data-testid={`points-${assignment.id}`}>
                    {assignment.points}
                  </p>
                </div>

                {/* Due Date */}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Due
                  </p>
                  <p className="font-semibold" data-testid={`due-date-${assignment.id}`}>
                    {assignment.dueDate ? format(new Date(assignment.dueDate), "MMM d, yyyy") : "No due date"}
                  </p>
                  {daysUntilDue !== null && (
                    <p className={`text-sm ${isOverdue ? "text-red-600" : "text-muted-foreground"}`} data-testid={`days-${assignment.id}`}>
                      {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days left`}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2">
                    {(assignment as any).isCompleted || assignment.status === "completed" ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-600">Completed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar (if in progress) */}
              {assignment.status !== "completed" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Progress</p>
                  <Progress value={0} className="h-2" data-testid={`progress-${assignment.id}`} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
