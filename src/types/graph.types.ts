/**
 * Graph node representing a contact.
 */
export interface GraphNode {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  type: 'PRIMARY' | 'SECONDARY';
}

/**
 * Graph edge representing a secondary → primary link.
 */
export interface GraphEdge {
  source: number;
  target: number;
}

/**
 * Full contact graph response.
 */
export interface ContactGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
