/* MD
### 🏢 Loading IFC files
---

IFC is the most common format to share BIM data openly. Our libraries are able to load, navigate and even create and edit them directly. In this tutorial, you'll learn how to open an IFC model in the 3D scene.

:::tip IFC?

If you are not famliar with the construction industry, this might be the first time you come across this term. It stands for Industry Foundation Classes, and it's the most widespread standard for sharing BIM data freely, without depending on specific software manufacturers and their propietary formats.

:::

In this tutorial, we will import:

- `web-ifc` to get some IFC items.
- `@thatopen/ui` to add some simple and cool UI menus.
- `@thatopen/components` to set up the barebone of our app.
- `Stats.js` (optional) to measure the performance of our app.
*/

import * as WEBIFC from "web-ifc";
import * as BUI from "@thatopen/ui";
import Stats from "stats.js";
import * as OBC from "@thatopen/components";

/* MD
  ### 🌎 Setting up a simple scene
  ---

  We will start by creating a simple scene with a camera and a renderer. If you don't know how to set up a scene, you can check the Worlds tutorial.
*/

const container = document.getElementById("container")!;

const components = new OBC.Components();

const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.SimpleScene,
  OBC.SimpleCamera,
  OBC.SimpleRenderer
>();

world.scene = new OBC.SimpleScene(components);
world.renderer = new OBC.SimpleRenderer(components, container);
world.camera = new OBC.SimpleCamera(components);

components.init();

world.camera.controls.setLookAt(12, 6, 8, 0, 0, -10);

world.scene.setup();

const grids = components.get(OBC.Grids);
grids.create(world);

/* MD

  We'll make the background of the scene transparent so that it looks good in our docs page, but you don't have to do that in your app!

*/

world.scene.three.background = null;

/* MD
  ### 🚗🏎️ Getting IFC and fragments
  ---
  When we read an IFC file, we convert it to a geometry called Fragments. Fragments are a lightweight representation of geometry built on top of THREE.js `InstancedMesh` to make it easy to work with BIM data efficiently. All the BIM geometry you see in our libraries are Fragments, and they are great: they are lightweight, they are fast and we have tons of tools to work with them. But fragments are not used outside our libraries. So how can we convert an IFC file to fragments? Let's check out how:
  */

const fragments = components.get(OBC.FragmentsManager);
const fragmentIfcLoader = components.get(OBC.IfcLoader);

/* MD
  :::info Why not just IFC?

  IFC is nice because it lets us exchange data with many tools in the AECO industry. But your graphics card doesn't understand IFC. It only understands one thing: triangles. So we must convert IFC to triangles. There are many ways to do it, some more efficient than others. And that's exactly what Fragments are: a very efficient way to display the triangles coming from IFC files.

  :::

  Once Fragments have been generated, you can export them and then load them back directly, without needing the original IFC file. Why would you do that? Well, because fragments can load +10 times faster than IFC. And the reason is very simple.   When reading an IFC, we must parse the file, read the implicit geometry, convert it to triangles (Fragments) and send it to the GPU. When reading fragments, we just take the triangles and send them, so it's super fast.

  :::danger How to use Fragments?

  If you want to find out more about Fragments, check out the Fragments Manager tutorial.

  :::


  ### 🔭🔧 Calibrating the converter
  ---
  Now, we need to configure the path of the WASM files. What's WASM? It's a technology that lets us run C++ on the browser, which means that we can load IFCs super fast! These files are the compilation of our `web-ifc` library. You can find them in the github repo and in NPM. These files need to be available to our app, so you have 2 options:

  - Download them and serve them statically.
  - Get them from a remote server.

  The easiest way is getting them from unpkg, and the cool thing is that you don't need to do it manually! It can be done directly by the tool just by writing the following:
  */

await fragmentIfcLoader.setup();

// If you want to the path to unpkg manually, then you can skip the line
// above and set them manually as below:
// fragmentIfcLoader.settings.wasm = {
//   path: "https://unpkg.com/web-ifc@0.0.57/",
//   absolute: true,
// };


/* MD
  We can further configure the conversion using the `webIfc` object. In this example, we will make the IFC model go to the origin of the scene (don't worry, this supports model federation):
  */

fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;


/* MD
  ### 🔎 Setting up the finder
  ---

 Now, let's get the finder component and create a new queryGroup. A query group is a set of "questions" we can apply to one or many models.
*/

const finder = components.get(OBC.IfcFinder);
const queryGroup = finder.create();


/* MD
  ### 🚗🔥 Loading the IFC
  ---
  Next, let's define a function to load the IFC programmatically. We have hardcoded the path to one of our IFC files, but feel free to do this with any of your own files!
  
  Now we feed the IFC file to the finder. The finder operates on IFC files directly, so it can perform high-performance text queries.

 :::info Opening local IFCs

  Keep in mind that the browser can't access the file of your computer directly, so you will need to use the Open File API to open local files.

  :::
*/

const fileResponse = await fetch(
  "https://thatopen.github.io/engine_components/resources/small.ifc",
);
const data = await fileResponse.arrayBuffer();
const buffer = new Uint8Array(data);
const model = await fragmentIfcLoader.load(buffer);
// model.name = "example";
world.scene.three.add(model);


const ifcFile = new File([data], "example");


/* MD
 Great! Now, let's create our first query. There are different types of queries. You'll have to pick one or another depending on the type of data you are looking for. In this case we want to check the direct attributes of elements, so we will use an IfcBasicQuery.
*/

const basicQuery = new OBC.IfcBasicQuery(components, {
  name: "category",
  inclusive: false,
  rules: [],
});

queryGroup.add(basicQuery);

/* MD
 Great job! Now we have a query, but it's empty. Queries are made of rules. There are rules of different types for different purposes. In this case we want to filter the walls, so let's a
*/

const categoryRule: OBC.IfcCategoryRule = {
  type: "category",
  value: /IfcWallStandardCase/,
};

basicQuery.rules.push(categoryRule);

/* MD
 Awesome! Now, our library has better ways to filter by category, so what's the point of the finder? Well, let's make something a bit more complex. Imagine we want to look for any object that has any property (in a pset) with the word "yeso" (plaster in spanish). We can do this easily with the finder using another type of query: a property query.
*/

const propertyRule: OBC.IfcPropertyRule = {
  type: "property",
  name: /.*/,
  value: /yeso/,
};

const propertyQuery = new OBC.IfcPropertyQuery(components, {
  name: "property",
  inclusive: false,
  rules: [propertyRule],
});

queryGroup.add(propertyQuery);

/* MD
 Great! Now, to perform the query we just need to update the group, and we can then get the items resulting from all the queries of the query group. To illustrate this, we'll isolate the found items in the scene:
*/

await queryGroup.update(model.uuid, ifcFile);
const items = queryGroup.items;

const hider = components.get(OBC.Hider);
hider.set(false);
hider.set(true, items);


/* MD
  ### ⏱️ Measuring the performance (optional)
  ---

  We'll use the [Stats.js](https://github.com/mrdoob/stats.js) to measure the performance of our app. We will add it to the top left corner of the viewport. This way, we'll make sure that the memory consumption and the FPS of our app are under control.
*/

const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.left = "0px";
stats.dom.style.zIndex = "unset";
world.renderer.onBeforeUpdate.add(() => stats.begin());
world.renderer.onAfterUpdate.add(() => stats.end());

/* MD
  ### 🧩 Adding some UI
  ---

  We will use the `@thatopen/ui` library to add some simple and cool UI elements to our app. First, we need to call the `init` method of the `BUI.Manager` class to initialize the library:
*/

BUI.Manager.init();

/* MD
Now we will add some UI to play around with the Finder, isolating the items that it finds in the scene. For more information about the UI library, you can check the specific documentation for it!
*/

const categoryInput = BUI.Component.create<BUI.TextInput>(() => {
  return BUI.html`
  <bim-text-input label="Category" value="${categoryRule.value.source}"></bim-text-input>
  `;
});

const propertyInput = BUI.Component.create<BUI.TextInput>(() => {
  return BUI.html`
  <bim-text-input label="Property" value="${propertyRule.value.source}"></bim-text-input>
  `;
});

const updateFinder = async () => {
  basicQuery.clear();
  propertyQuery.clear();
  categoryRule.value = new RegExp(categoryInput.value);
  propertyRule.value = new RegExp(propertyInput.value);
  await queryGroup.update(model.uuid, ifcFile);
  const items = queryGroup.items;
  console.log(items);
  if (Object.keys(items).length === 0) {
    alert("No items found!");
    return;
  }
  hider.set(false);
  hider.set(true, items);
};

const panel = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
  <bim-panel active label="IFC Finder Tutorial" class="options-menu">
    <bim-panel-section collapsed label="Controls">
      <bim-panel-section style="padding-top: 12px;">
      
        ${categoryInput}
        ${propertyInput}
      
        <bim-button label="Update"
          @click="${async () => {
            await updateFinder();
          }}">
        </bim-button>  
      
      </bim-panel-section>
      
    </bim-panel>
  `;
});

document.body.append(panel);

/* MD
  And we will make some logic that adds a button to the screen when the user is visiting our app from their phone, allowing to show or hide the menu. Otherwise, the menu would make the app unusable.
*/

const button = BUI.Component.create<BUI.PanelSection>(() => {
  return BUI.html`
      <bim-button class="phone-menu-toggler" icon="solar:settings-bold"
        @click="${() => {
          if (panel.classList.contains("options-menu-visible")) {
            panel.classList.remove("options-menu-visible");
          } else {
            panel.classList.add("options-menu-visible");
          }
        }}">
      </bim-button>
    `;
});

document.body.append(button);

/* MD
  ### 🎉 Wrap up
  ---

  That's it! You have created an app that can make complex text queries in an IFC. Congratulations!
*/