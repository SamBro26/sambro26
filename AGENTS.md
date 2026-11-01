<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Active conversations use AppShell's chatView mode sized to the visual viewport, with a separately scrolling history and a non-shrinking composer; this keeps mobile keyboards from covering message entry without changing other pages.
- New HTTP endpoints live as TanStack server routes under src/routes/api (never a new Supabase Edge Function, which the platform refuses to create); src/routes/api/migrate-helper.ts is an empty placeholder kept for migration steps, so it must stay logic-free until real steps are added.
