"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface JobTodosProps {
  todos: TodoItem[];
  onAddTodo: (text: string) => void;
  onToggleTodo: (todoId: string) => void;
  onRemoveTodo: (todoId: string) => void;
  onUpdateTodo: (todoId: string, text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function JobTodos({
  todos,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onUpdateTodo,
  disabled = false,
  className,
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
    if (editingId && editText.trim()) {
      onUpdateTodo(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
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

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Task List
          </div>
          {totalCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {completedCount}/{totalCount} done
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Todo Items */}
        {todos.length > 0 ? (
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={cn(
                  "group flex items-center gap-3 p-2 rounded-lg border transition-colors",
                  todo.completed
                    ? "bg-muted/30 border-transparent"
                    : "bg-background hover:bg-muted/50 border-border/50"
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => !disabled && onToggleTodo(todo.id)}
                  disabled={disabled}
                  className="shrink-0"
                />

                {editingId === todo.id ? (
                  <Input
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={handleEditKeyDown}
                    className="h-7 text-sm flex-1"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(todo)}
                    className={cn(
                      "flex-1 text-sm cursor-pointer transition-colors",
                      todo.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground hover:text-primary"
                    )}
                  >
                    {todo.text}
                  </span>
                )}

                {!disabled && !todo.completed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveTodo(todo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
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
              placeholder="Add a task..."
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              onClick={handleAddTodo}
              disabled={!newTodoText.trim()}
              className="h-9 px-3"
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
}

export function InlineTodos({
  todos,
  onChange,
  disabled = false,
  className,
}: InlineTodosProps) {
  const handleAddTodo = (text: string) => {
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
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
    />
  );
}
