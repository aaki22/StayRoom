export interface EmptyRequestPart {
  readonly [key: string]: never;
}

export interface ValidatedRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, unknown>,
  THeaders = Record<string, unknown>,
> {
  body: TBody;
  params: TParams;
  query: TQuery;
  headers: THeaders;
}