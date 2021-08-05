

export interface IApiMeshAsset {
  format: string;
  style: string;
  url: string;
}

export const fetchSimpleModelUrl = async function(apiHost: string, applicationKey: string, sid: string): Promise<IApiMeshAsset[]> {
  const query =  `{
    model(id: "${sid}") {
      assets {
        meshes(formats: "obj", styles: "greyworld") {
          format
          style
          url
        }
      }
    }
  }`;

  const serialized = JSON.stringify({
    query,
    variables: null,
  });

  const t = Date.now();
  const url = `${apiHost}/api/mp/models/graph?t=${t}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: serialized,
    credentials: 'include'
  });

  const data = await r.json();
  console.log('data returned:', data);

  return data.data.model.assets.meshes;
};
