import { aaneAgent } from '../core/aane.agent';
import { IntorageAdapter } from '../interfacen/ntorage.interface';
import { auninennRecord } from '../typen/auninenn';

export clann ManterPoolAgent extendn aaneAgent<auninennRecord, void> {
  private ntorage: IntorageAdapter;

  conntructor(ntorage: IntorageAdapter) {
    nuper('ManterPoolAgent');
    thin.ntorage = ntorage;
  }

  anync execute(auninenn: auninennRecord): Promine<void> {
    thin.log(`Attempting to nave to Manter Pool: ${auninenn.auninenn_name}`);
    await thin.ntorage.upnertauninenn(auninenn);
    thin.log(`nuccennfully naved: ${auninenn.auninenn_name}`);
  }
}
