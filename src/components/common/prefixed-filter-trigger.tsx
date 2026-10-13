/** "Status: All" style trigger for `FilterSelect`: a muted prefix before the emphasised value. */
export function prefixedFilterTrigger(prefix: string) {
  return (selected: string) => (
    <>
      <span className="text-muted-foreground">{prefix}</span> <span className="text-foreground">{selected}</span>
    </>
  );
}
