import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/api";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "active":
      return "default";
    case "archived":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

interface ProjectTableProps {
  projects: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
              No projects found.
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => (
            <TableRow key={project.name}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.owner_email}</TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
