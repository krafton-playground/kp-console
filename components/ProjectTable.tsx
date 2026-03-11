import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/supabase";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "active": return "default";
    case "suspended": return "secondary";
    case "deleting":
    case "deleted": return "destructive";
    default: return "outline";
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
          <TableHead>Template</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No projects found.
            </TableCell>
          </TableRow>
        ) : (
          projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projects/${project.name}`} className="hover:underline">
                  <div>
                    <p>{project.display_name ?? project.name}</p>
                    {project.display_name && (
                      <p className="text-xs text-muted-foreground">{project.name}</p>
                    )}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{project.template}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{project.owner_email}</TableCell>
              <TableCell className="text-sm">
                {project.github_repo ? (
                  <a
                    href={`https://github.com/${project.github_repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {project.github_repo}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(project.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
