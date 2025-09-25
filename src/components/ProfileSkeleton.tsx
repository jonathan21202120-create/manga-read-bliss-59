import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-surface">
      <Navigation />
      
      <main className="container mx-auto px-6 py-12 space-y-8">
        {/* Profile Header Skeleton */}
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              
              <div className="text-center md:text-left flex-1 space-y-3">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
                <div className="flex justify-center md:justify-start gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-manga-surface-elevated border-border/50">
              <CardContent className="p-4 text-center space-y-2">
                <Skeleton className="h-8 w-8 mx-auto rounded-lg" />
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Goals and Achievements Skeleton */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-manga-surface-elevated border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-manga-surface-elevated border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-manga-surface rounded-lg">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Reading History Skeleton */}
        <Card className="bg-manga-surface-elevated border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <ReadingHistorySkeleton />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export function ReadingHistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-manga-surface rounded-lg">
          <Skeleton className="w-16 h-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2 w-full mt-2" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}