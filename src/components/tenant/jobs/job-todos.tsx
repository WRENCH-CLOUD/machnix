"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Wrench, RefreshCw, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Re-export shared types for backwards compatibility
export type { TodoStatus, TodoItem } from "@/modules/job/domain/todo.types";
import type { TodoItem, TodoStatus } from "@/modules/job/domain/todo.types";

interface JobTodosProps {
  todos: TodoItem[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (todoId: string) => void;
  onRemoveTodo: (todoId: string) => void;
  onUpdateTodo: (todoId: string, text: string) => void;
  onUpdateTodoStatus?: (todoId: string, status: TodoStatus) => void;
  disabled?: boolean;
  className?: string;
  maxTodos?: number;
}

export function JobTodos({
  todos,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onUpdateTodo,
  onUpdateTodoStatus,
  disabled = false,
  className,
  maxTodos = 30,
}: JobTodosProps) {
  const [newTodoText, setNewTodoText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleAddTodo = () => {
    const text = newTodoText.trim();
    if (!text) return;
    
    // Check task limit
    if (todos.length >= maxTodos) {
      toast.error(`Cannot add more than ${maxTodos} tasks per job`);
      return;
    }
    
    onAddTodo(text);
    setNewTodoText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTodo();
    }
  };

  const startEdit = (todo: TodoItem) => {
    if (disabled || todo.completed) return;
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    // If the trimmed text is empty, cancel to avoid saving empty todos
    if (!trimmed) {
      cancelEdit();
      return;
    }
    const currentTodo = todos.find((todo) => todo.id === editingId);
    // Only persist the change if the text has actually changed
    if (!currentTodo || currentTodo.text !== trimmed) {
      onUpdateTodo(editingId, trimmed);
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const isAtLimit = totalCount >= maxTodos;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Task List
          </div>
          {totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {completedCount}/{totalCount} done
              {isAtLimit && " (max)"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Todo Items */}
        {todos.length > 0 ? (
          <div className="space-y-2 wrap-break-word">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "group p-2 rounded-lg border transition-colors",
                  todo.completed
                    ? "bg-muted/30 border-transparent"
                    : "bg-background hover:bg-muted/50 border-border/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => !disabled && onToggleTodo(todo.id)}
                    disabled={disabled}
                    className="shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <Input
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="h-7 text-sm"
                      />
                    ) : (
                      <span
                        className={cn(
                          "text-sm warp-break-words whitespace-pre-wrap cursor-pointer",
                          todo.completed && "line-through text-muted-foreground"
                        )}
                        onClick={() => startEdit(todo)}
                      >
                        {todo.text}
                      </span>
                    )}
                  </div>

                  {!disabled && !todo.completed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => onRemoveTodo(todo.id)}
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {/* Status Buttons */}
                {onUpdateTodoStatus && (
                  <div className="flex gap-1 mt-2 ml-7">
                    <Button
                      variant={todo.status === "changed" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-xs gap-1",
                        todo.status === "changed" && "bg-blue-600 hover:bg-blue-700"
                      )}
                      onClick={() => onUpdateTodoStatus(todo.id, todo.status === "changed" ? null : "changed")}
                      disabled={disabled}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Changed
                    </Button>
                    <Button
                      variant={todo.status === "repaired" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-xs gap-1",
                        todo.status === "repaired" && "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => onUpdateTodoStatus(todo.id, todo.status === "repaired" ? null : "repaired")}
                      disabled={disabled}
                    >
                      <Wrench className="h-3 w-3" />
                      Repaired
                    </Button>
                    <Button
                      variant={todo.status === "no_change" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-6 px-2 text-xs gap-1",
                        todo.status === "no_change" && "bg-gray-600 hover:bg-gray-700"
                      )}
                      onClick={() => onUpdateTodoStatus(todo.id, todo.status === "no_change" ? null : "no_change")}
                      disabled={disabled}
                    >
                      <MinusCircle className="h-3 w-3" />
                      No Change
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            No tasks yet
          </p>
        )}

        {/* Add New Todo */}
        {!disabled && (
          <div className="flex gap-2 pt-2">
            <Input
              placeholder={isAtLimit ? `Task limit reached (${maxTodos})` : "Add a task..."}
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 text-sm"
              disabled={isAtLimit}
            />
            <Button
              size="sm"
              onClick={handleAddTodo}
              disabled={!newTodoText.trim() || isAtLimit}
              className="h-9 px-3"
              aria-label="Add task"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Inline variant for use within forms (e.g., create wizard)
// ============================================

interface InlineTodosProps {
  todos: TodoItem[];
  onChange: (todos: TodoItem[]) => void;
  disabled?: boolean;
  className?: string;
  maxTodos?: number;
}

export function InlineTodos({
  todos,
  onChange,
  disabled = false,
  className,
  maxTodos = 30,
}: InlineTodosProps) {
  const handleAddTodo = (text: string) => {
    // Check task limit
    if (todos.length >= maxTodos) {
      toast.error(`Cannot add more than ${maxTodos} tasks per job`);
      return;
    }
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
      status: null,
      createdAt: new Date().toISOString(),
    };
    onChange([...todos, newTodo]);
  };

  const handleToggleTodo = (todoId: string) => {
    onChange(
      todos.map((t) =>
        t.id === todoId
          ? {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : undefined,
          }
          : t
      )
    );
  };

  const handleRemoveTodo = (todoId: string) => {
    onChange(todos.filter((t) => t.id !== todoId));
  };

  const handleUpdateTodo = (todoId: string, text: string) => {
    onChange(todos.map((t) => (t.id === todoId ? { ...t, text } : t)));
  };

  return (
    <JobTodos
      todos={todos}
      onAddTodo={handleAddTodo}
      onToggleTodo={handleToggleTodo}
      onRemoveTodo={handleRemoveTodo}
      onUpdateTodo={handleUpdateTodo}
      disabled={disabled}
      className={className}
      maxTodos={maxTodos}
    />
  );
}
