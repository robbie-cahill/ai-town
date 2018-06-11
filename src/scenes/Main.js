import Player from '../game-objects/Player';
import Arrow from '../game-objects/Arrow';

const CAMERA_LERP = 1;
const ARROW_SPEED = 150;
const TREANT_SPEED = 500;
const destroySpriteAttackDelay = 200;
const treantOpacityDelay = 100;
var treantAttack = null;

const NPC_POS = {
  x: 50,
  y: 150,
};

class Main extends Phaser.Scene {
  constructor() {
    super('Main');
    this.player = null;
    this.cursors = null;
    this.npc = {
      gameObject: null,
      textGameObject: null,
    };
    this.treant = null;
    this.hearts = [];
    this.tomb = null;
    this.map = null;
    this.layers = null;
  }

  helloNPC() {
    this.npc.textGameObject.setAlpha(1);
  }

  createMapWithLayers() {
    this.map = this.make.tilemap({ key: 'myworld' });
    const tileset = this.map.addTilesetImage('tileset', 'tiles', 16, 16, 0, 0);

    this.layers = {
      terrain: this.map.createStaticLayer('terrain', tileset, 0, 0),
      deco: this.map.createStaticLayer('deco', tileset, 0, 0),
      bridge: this.map.createStaticLayer('bridge', tileset, 0, 0),
    };
    this.layers.terrain.setCollisionByProperty({ collides: true });
    this.layers.deco.setCollisionByProperty({ collides: true });
  }

  initPlayer() {
    this.player = new Player(this);
  }

  initTreant() {
    this.treant = this.physics.add.sprite(500, 500, 'treant').setDepth(5);
    this.treant.hp = 3;
    this.treant.setCollideWorldBounds(true);

    this.time.addEvent({
      delay: 500,
      callback: this.moveTreant,
      callbackScope: this,
      repeat: Infinity,
      startAt: 2000,
    });
  }

  initNpc() {
    this.npc.gameObject = this.physics.add.sprite(NPC_POS.x, NPC_POS.y, 'npcs', 0);
    this.npc.textGameObject = this.add.text(NPC_POS.x - 35, NPC_POS.y - 20, 'Hello there!', {
      align: 'center',
      fontSize: '10px',
    });
    this.npc.textGameObject.setAlpha(0);
    this.npc.gameObject.setImmovable(true);
  }

  addColliders() {
    this.physics.add.collider(this.treant, this.layers.terrain);
    this.physics.add.collider(this.treant, this.layers.deco);
    this.physics.add.collider(this.treant, this.player.gameObject, this.treantHit.bind(this));

    this.physics.add.collider(this.player.gameObject, this.layers.terrain);
    this.physics.add.collider(this.player.gameObject, this.layers.deco);
    this.physics.add.collider(
      this.player.gameObject,
      this.npc.gameObject,
      this.helloNPC.bind(this)
    );
  }

  initCamera() {
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player.gameObject, true, CAMERA_LERP, CAMERA_LERP);
  }

  create() {
    this.createMapWithLayers();

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.initPlayer();

    this.initNpc();
    this.initTreant();

    this.addColliders();

    this.initCamera();

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.destroyTreantAttack();
    this.checkTreantOpacity();
    if (this.player.gameObject.active) {
      this.player.gameObject.setVelocity(0);
    }
    if (this.treant.active) {
      this.treant.setVelocity(0);
    }

    const keyPressed = {
      left: this.cursors.left.isDown,
      right: this.cursors.right.isDown,
      up: this.cursors.up.isDown,
      down: this.cursors.down.isDown,
      space: this.cursors.space.isDown,
      shift: this.cursors.shift.isDown,
    };

    this.player.update(keyPressed);

    if (keyPressed.shift) {
      if (this.player.loading) {
        return;
      }
      this.player.reload();
      const arrow = this.player.shoot();
      const arrowGameObject = arrow.gameObject;
      this.physics.add.collider(
        arrowGameObject,
        this.treant,
        this.treantLoseHp(arrowGameObject).bind(this)
      );
    }
  }

  moveTreant() {
    if (this.treant.active) {
      var diffX = this.treant.x - this.player.gameObject.x;
      var diffY = this.treant.y - this.player.gameObject.y;
      //Move according to X
      if (diffX < 0) {
        this.treant.scaleX = 1;
        this.treant.setVelocityX(TREANT_SPEED);
      } else {
        this.treant.scaleX = 1;
        this.treant.setVelocityX(-TREANT_SPEED);
      }
      //Move according to Y
      if (diffY < 0) {
        this.treant.scaleY = 1;
        this.treant.setVelocityY(TREANT_SPEED);
      } else {
        this.treant.scaleY = 1;
        this.treant.setVelocityY(-TREANT_SPEED);
      }
    }
  }

  treantHit() {
    if (this.player.canGetHit()) {
      treantAttack = this.physics.add.sprite(
        this.player.gameObject.x,
        this.player.gameObject.y,
        'treantAttack'
      );
      this.player.loseHp();
    }
  }

  treantLoseHp(arrow) {
    return () => {
      this.treant.hp--;
      this.treant.alpha = 0.1;
      this.treant.lastTimeHit = new Date().getTime();
      arrow.destroy();
      if (this.treant.hp == 0) {
        this.treant.destroy();
      }
    };
  }

  checkTreantOpacity() {
    if (new Date().getTime() - this.treant.lastTimeHit > treantOpacityDelay) {
      this.treant.alpha = 1;
    }
  }

  destroyTreantAttack() {
    if (
      treantAttack != null &&
      new Date().getTime() - this.player.lastTimeHit > destroySpriteAttackDelay
    ) {
      treantAttack.destroy();
    }
  }
}

export default Main;
