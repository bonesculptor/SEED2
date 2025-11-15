import { BaseRepository } from './BaseRepository';

export interface GraphNode {
  id: string;
  userId: string;
  label: string;
  nodeType: string;
  properties?: any;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  userId: string;
  source: string;
  target: string;
  relationship: string;
  properties?: any;
  createdAt: string;
}

export interface CreateNodeData {
  label: string;
  nodeType: string;
  properties?: any;
}

export interface CreateEdgeData {
  source: string;
  target: string;
  relationship: string;
  properties?: any;
}

export class GraphRepository extends BaseRepository<any> {
  async getNodes(userId: string): Promise<GraphNode[]> {
    const { data, error } = await this.db
      .from('graph_nodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch graph nodes');
    }

    return (data || []).map(this.nodeToDomain);
  }

  async getNodesByType(userId: string, nodeType: string): Promise<GraphNode[]> {
    const { data, error } = await this.db
      .from('graph_nodes')
      .select('*')
      .eq('user_id', userId)
      .eq('node_type', nodeType)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch graph nodes by type');
    }

    return (data || []).map(this.nodeToDomain);
  }

  async createNode(userId: string, nodeData: CreateNodeData): Promise<GraphNode> {
    const { data, error } = await this.db
      .from('graph_nodes')
      .insert({
        user_id: userId,
        label: nodeData.label,
        node_type: nodeData.nodeType,
        properties: nodeData.properties,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create graph node');
    }

    return this.nodeToDomain(data);
  }

  async getEdges(userId: string): Promise<GraphEdge[]> {
    const { data, error } = await this.db
      .from('graph_edges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch graph edges');
    }

    return (data || []).map(this.edgeToDomain);
  }

  async createEdge(userId: string, edgeData: CreateEdgeData): Promise<GraphEdge> {
    const { data, error } = await this.db
      .from('graph_edges')
      .insert({
        user_id: userId,
        source: edgeData.source,
        target: edgeData.target,
        relationship: edgeData.relationship,
        properties: edgeData.properties,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create graph edge');
    }

    return this.edgeToDomain(data);
  }

  async deleteNode(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from('graph_nodes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'delete graph node');
    }
  }

  async deleteAllNodes(userId: string): Promise<void> {
    const { error } = await this.db
      .from('graph_nodes')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'delete all graph nodes');
    }
  }

  async deleteAllEdges(userId: string): Promise<void> {
    const { error } = await this.db
      .from('graph_edges')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'delete all graph edges');
    }
  }

  private nodeToDomain(row: any): GraphNode {
    return {
      id: row.id,
      userId: row.user_id,
      label: row.label ?? 'Unknown',
      nodeType: row.node_type ?? 'unknown',
      properties: row.properties,
      createdAt: row.created_at,
    };
  }

  private edgeToDomain(row: any): GraphEdge {
    return {
      id: row.id,
      userId: row.user_id,
      source: row.source,
      target: row.target,
      relationship: row.relationship ?? 'related_to',
      properties: row.properties,
      createdAt: row.created_at,
    };
  }
}
