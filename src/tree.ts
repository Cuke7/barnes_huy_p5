import P5 from "p5";

const theta = 0.5;

export type NodeBody = {
  [key: string]: any;
  mass: number;
  pos: P5.Vector;
  index: number;
};

// A tree is composed of Nodes and each Nodes can have up to four Nodes childrens.
export class Node {
  topLeft: P5.Vector; // Coordinates of the top left corner
  topRight: P5.Vector;
  bottomRight: P5.Vector;
  bottomLeft: P5.Vector;
  depth: number; // 0 is the first node and contains the whole space
  center: P5.Vector; // Geometrical center of the node
  massCenter: P5.Vector;
  mass: number;
  width: number;
  body: NodeBody | null;
  topLeftNode?: Node;
  topRightNode?: Node;
  bottomRightNode?: Node;
  bottomLeftNode?: Node;

  constructor(
    topleft: P5.Vector,
    topRight: P5.Vector,
    bottomRight: P5.Vector,
    bottomLeft: P5.Vector,
    depth: number
  ) {
    this.topLeft = topleft;
    this.topRight = topRight;
    this.bottomLeft = bottomLeft;
    this.bottomRight = bottomRight;
    this.depth = depth;
    this.center = this.topRight.copy().add(this.bottomLeft).div(2);
    this.massCenter = new P5.Vector(0, 0);
    this.mass = 0;
    this.width = this.topRight.copy().sub(this.topLeft).x / 2;
    this.body = null;
  }

  // When a body is inserted into the node
  updateMassCenter(newBody: NodeBody) {
    let m = newBody.mass;
    let pos = newBody.pos.copy();
    let wPos = pos.mult(m);
    this.massCenter
      .mult(this.mass)
      .add(wPos)
      .div(this.mass + m); // Weighted average on the massCenter of the node
    this.mass += newBody.mass; // New total mass of the node
  }

  addBody(newBody: NodeBody) {
    this.updateMassCenter(newBody);
    // If a body is present in the node
    if (this.body) {
      // Subdivide the node into 4 new quadrants (4 sub nodes)
      // TOP LEFT
      this.topLeftNode = new Node(
        this.topLeft.copy(),
        this.topRight.copy().add(this.topLeft).div(2),
        this.center,
        this.bottomLeft.copy().add(this.topLeft).div(2),
        this.depth + 1
      );
      // TOP RIGHT
      this.topRightNode = new Node(
        this.topRight.copy().add(this.topLeft).div(2),
        this.topRight.copy(),
        this.bottomRight.copy().add(this.topRight).div(2),
        this.center,
        this.depth + 1
      );
      // BOTTOM RIGHT
      this.bottomRightNode = new Node(
        this.center,
        this.bottomRight.copy().add(this.topRight).div(2),
        this.bottomRight.copy(),
        this.bottomRight.copy().add(this.bottomLeft).div(2),
        this.depth + 1
      );
      // BOTTOM LEFT
      this.bottomLeftNode = new Node(
        this.bottomLeft.copy().add(this.topLeft).div(2),
        this.center,
        this.bottomRight.copy().add(this.bottomLeft).div(2),
        this.bottomLeft.copy(),
        this.depth + 1
      );
      // Place the new body in the correct subnode that we just created
      this.placeBody(newBody);
      // Place the body already present in the node in the correct subnode that we just created
      this.placeBody(this.body);
      // Remove the already present body
      this.body = null;
    }
    // There is no body in the node
    else {
      // If the node already has sub nodes, place the body in the correct node
      if (
        this.bottomLeftNode &&
        this.bottomRightNode &&
        this.topLeftNode &&
        this.topRightNode
      ) {
        // Place the body in the correct subnode
        this.placeBody(newBody);
      } else {
        // The node dosen't have subnode and is empty so the new body belongs here
        this.body = newBody;
      }
    }
  }

  // Compute in which sub node does a body belong, according to its position
  placeBody(body: NodeBody) {
    // If the body belongs in the TOP LEFT subnode
    if (body.pos.x < this.center.x && body.pos.y < this.center.y)
      //@ts-ignore
      this.topLeftNode.addBody(body);
    // ... TOP RIGHT subnode
    if (body.pos.x > this.center.x && body.pos.y < this.center.y)
      //@ts-ignore
      this.topRightNode.addBody(body);
    // ... BOTTOM RIGHT subnode
    if (body.pos.x > this.center.x && body.pos.y > this.center.y)
      //@ts-ignore
      this.bottomRightNode.addBody(body);
    // ... BOTTOM LEFT subnode
    if (body.pos.x < this.center.x && body.pos.y > this.center.y)
      //@ts-ignore
      this.bottomLeftNode.addBody(body);
  }

  // Computes how a body passed in argument is affected by the current nodeBody (or its subnodes)
  calcForces(
    p5: P5,
    body: NodeBody,
    customUpdate: (p5: P5, nodeBody: NodeBody, body: NodeBody) => void
  ) {
    // If the node doesn't have subnodes
    if (!this.bottomLeftNode) {
      // If the node has a body and that body is not the body passed in argument
      if (this.body && body.index != this.body.index) {
        customUpdate(p5, this.body, body);
      }
    } else {
      // The node does have sub nodes
      let d = p5.dist(
        body.pos.x,
        body.pos.y,
        this.massCenter.x,
        this.massCenter.y
      );
      let ratio = this.width / d;
      // If the node is sufficiently far away
      if (ratio < theta) {
        customUpdate(
          p5,
          { pos: this.massCenter, mass: this.mass, index: -1 },
          body
        );
      } else {
        // The node isn't far away enough, call calForce on all its subnodes
        this.bottomLeftNode?.calcForces(p5, body, customUpdate);
        this.bottomRightNode?.calcForces(p5, body, customUpdate);
        this.topLeftNode?.calcForces(p5, body, customUpdate);
        this.topRightNode?.calcForces(p5, body, customUpdate);
      }
    }
  }

  draw(p5: P5) {
    p5.textSize(14);
    p5.fill("red");
    p5.stroke("red");
    p5.strokeWeight(1);
    // If the node has subnodes
    if (
      this.bottomLeftNode &&
      this.bottomRightNode &&
      this.topRightNode &&
      this.topLeftNode
    ) {
      p5.noFill();
      p5.stroke(255);
      p5.rect(
        this.topRightNode.topLeft.x,
        this.topRightNode.topLeft.y,
        this.topRightNode.bottomRight.x,
        this.topRightNode.bottomRight.y
      );
      p5.rect(
        this.topRightNode.topLeft.x,
        this.topRightNode.topLeft.y,
        this.topRightNode.bottomRight.x,
        this.topRightNode.bottomRight.y
      );
      p5.rect(
        this.topLeftNode.topLeft.x,
        this.topLeftNode.topLeft.y,
        this.topLeftNode.bottomRight.x,
        this.topLeftNode.bottomRight.y
      );
      p5.rect(
        this.bottomRightNode.topLeft.x,
        this.bottomRightNode.topLeft.y,
        this.bottomRightNode.bottomRight.x,
        this.bottomRightNode.bottomRight.y
      );
      p5.rect(
        this.bottomLeftNode.topLeft.x,
        this.bottomLeftNode.topLeft.y,
        this.bottomLeftNode.bottomRight.x,
        this.bottomLeftNode.bottomRight.y
      );

      this.topRightNode.draw(p5);
      this.topLeftNode.draw(p5);
      this.bottomRightNode.draw(p5);
      this.bottomLeftNode.draw(p5);

      // Plot the center of mass of a node
      p5.stroke("red");
      p5.noFill();
      p5.ellipse(this.massCenter.x, this.massCenter.y, this.mass);
      p5.stroke("white");
      p5.fill("white");
      p5.textSize(15);
      p5.text(this.depth + 1, this.massCenter.x, this.massCenter.y);
    } else {
      p5.text(this.depth, this.topRight.x - 15, this.topRight.y + 15);
    }
  }
}
