import java.awt.*;
import java.awt.event.*;
import java.util.HashSet;
import java.util.Random;
import javax.swing.*;

public class PacMan extends JPanel implements ActionListener, KeyListener {
    class Entity {
        int x;
        int y;
        int width;
        int height;
        Image image;

        int startX;
        int startY;
        char direction = 'U'; // U D L R
        int velocityX = 0;
        int velocityY = 0;

        Entity(Image image, int x, int y, int width, int height) {
            this.image = image;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.startX = x;
            this.startY = y;
        }

        void updateDirection(char direction) {
            char prevDirection = this.direction;
            this.direction = direction;
            updateVelocity();
            this.x += this.velocityX;
            this.y += this.velocityY;
            for (Entity wall : wallTiles) {
                if (intersects(this, wall)) {
                    this.x -= this.velocityX;
                    this.y -= this.velocityY;
                    this.direction = prevDirection;
                    updateVelocity();
                }
            }
        }

        void updateVelocity() {
            if (this.direction == 'U') {
                this.velocityX = 0;
                this.velocityY = -tileSize/4;
            }
            else if (this.direction == 'D') {
                this.velocityX = 0;
                this.velocityY = tileSize/4;
            }
            else if (this.direction == 'L') {
                this.velocityX = -tileSize/4;
                this.velocityY = 0;
            }
            else if (this.direction == 'R') {
                this.velocityX = tileSize/4;
                this.velocityY = 0;
            }
        }

        void reset() {
            this.x = this.startX;
            this.y = this.startY;
        }
    }

    private int rowCount = 21;
    private int columnCount = 19;
    private int tileSize = 32;
    private int boardWidth = columnCount * tileSize;
    private int boardHeight = rowCount * tileSize;

    private Image wallImage;
    private Image blueGhostImage;
    private Image orangeGhostImage;
    private Image pinkGhostImage;
    private Image redGhostImage;

    private Image pacmanUpImage;
    private Image pacmanDownImage;
    private Image pacmanLeftImage;
    private Image pacmanRightImage;

    //X = wall, O = skip, P = pac man, ' ' = food
    //Ghosts: b = blue, o = orange, p = pink, r = red
    private String[] levelLayout = {
        "XXXXXXXXXXXXXXXXXXX",
        "X        X        X",
        "X XX XXX X XXX XX X",
        "X                 X",
        "X XX X XXXXX X XX X",
        "X    X       X    X",
        "XXXX XXXX XXXX XXXX",
        "OOOX X       X XOOO",
        "XXXX X XXrXX X XXXX",
        "O       bpo       O",
        "XXXX X XXXXX X XXXX",
        "OOOX X       X XOOO",
        "XXXX X XXXXX X XXXX",
        "X        X        X",
        "X XX XXX X XXX XX X",
        "X  X     P     X  X",
        "XX X X XXXXX X X XX",
        "X    X   X   X    X",
        "X XXXXXX X XXXXXX X",
        "X                 X",
        "XXXXXXXXXXXXXXXXXXX" 
    };

    HashSet<Entity> wallTiles;
    HashSet<Entity> pellets;
    HashSet<Entity> specters;
    Entity hero;

    Timer gameLoop;
    char[] directions = {'U', 'D', 'L', 'R'}; //up down left right
    Random random = new Random();
    int score = 0;
    int lives = 3;
    boolean gameOver = false;

    PacMan() {
        setPreferredSize(new Dimension(boardWidth, boardHeight));
        setBackground(Color.BLACK);
        addKeyListener(this);
        setFocusable(true);

        //load images
        wallImage = new ImageIcon(getClass().getResource("./wall.png")).getImage();
        blueGhostImage = new ImageIcon(getClass().getResource("./blueGhost.png")).getImage();
        orangeGhostImage = new ImageIcon(getClass().getResource("./orangeGhost.png")).getImage();
        pinkGhostImage = new ImageIcon(getClass().getResource("./pinkGhost.png")).getImage();
        redGhostImage = new ImageIcon(getClass().getResource("./redGhost.png")).getImage();

        pacmanUpImage = new ImageIcon(getClass().getResource("./pacmanUp.png")).getImage();
        pacmanDownImage = new ImageIcon(getClass().getResource("./pacmanDown.png")).getImage();
        pacmanLeftImage = new ImageIcon(getClass().getResource("./pacmanLeft.png")).getImage();
        pacmanRightImage = new ImageIcon(getClass().getResource("./pacmanRight.png")).getImage();

        parseLevel();
        for (Entity ghost : specters) {
            char newDirection = directions[random.nextInt(4)];
            ghost.updateDirection(newDirection);
        }
        //how long it takes to start timer, milliseconds gone between frames
        gameLoop = new Timer(50, this); //20fps (1000/50)
        gameLoop.start();

    }

    public void parseLevel() {
        wallTiles = new HashSet<Entity>();
        pellets = new HashSet<Entity>();
        specters = new HashSet<Entity>();

        for (int r = 0; r < rowCount; r++) {
            for (int c = 0; c < columnCount; c++) {
                String row = levelLayout[r];
                char ch = row.charAt(c);

                int x = c * tileSize;
                int y = r * tileSize;

                if (ch == 'X') { // wall
                    Entity wall = new Entity(wallImage, x, y, tileSize, tileSize);
                    wallTiles.add(wall);
                } else if (ch == 'b') { // blue ghost
                    Entity ghost = new Entity(blueGhostImage, x, y, tileSize, tileSize);
                    specters.add(ghost);
                } else if (ch == 'o') { // orange ghost
                    Entity ghost = new Entity(orangeGhostImage, x, y, tileSize, tileSize);
                    specters.add(ghost);
                } else if (ch == 'p') { // pink ghost
                    Entity ghost = new Entity(pinkGhostImage, x, y, tileSize, tileSize);
                    specters.add(ghost);
                } else if (ch == 'r') { // red ghost
                    Entity ghost = new Entity(redGhostImage, x, y, tileSize, tileSize);
                    specters.add(ghost);
                } else if (ch == 'P') { // player
                    hero = new Entity(pacmanRightImage, x, y, tileSize, tileSize);
                } else if (ch == ' ') { // pellet
                    Entity pellet = new Entity(null, x + 14, y + 14, 4, 4);
                    pellets.add(pellet);
                }
            }
        }
    }

    public void paintComponent(Graphics g) {
        super.paintComponent(g);
        render(g);
    }

    public void render(Graphics g) {
        g.drawImage(hero.image, hero.x, hero.y, hero.width, hero.height, null);

        for (Entity ghost : specters) {
            g.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height, null);
        }

        for (Entity wall : wallTiles) {
            g.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height, null);
        }

        g.setColor(Color.WHITE);
        for (Entity pellet : pellets) {
            g.fillRect(pellet.x, pellet.y, pellet.width, pellet.height);
        }
        //score
        g.setFont(new Font("Arial", Font.PLAIN, 18));
        if (gameOver) {
            g.drawString("Game Over: " + String.valueOf(score), tileSize/2, tileSize/2);
        }
        else {
            g.drawString("x" + String.valueOf(lives) + " Score: " + String.valueOf(score), tileSize/2, tileSize/2);
        }
    }

    public void updateGame() {
        hero.x += hero.velocityX;
        hero.y += hero.velocityY;

        // wall collisions
        for (Entity wall : wallTiles) {
            if (intersects(hero, wall)) {
                hero.x -= hero.velocityX;
                hero.y -= hero.velocityY;
                break;
            }
        }

        // ghost interactions and movement
        for (Entity ghost : specters) {
            if (intersects(ghost, hero)) {
                lives -= 1;
                if (lives == 0) {
                    gameOver = true;
                    return;
                }
                resetEntities();
            }

            if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
                ghost.updateDirection('U');
            }
            ghost.x += ghost.velocityX;
            ghost.y += ghost.velocityY;
            for (Entity wall : wallTiles) {
                if (intersects(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                    ghost.x -= ghost.velocityX;
                    ghost.y -= ghost.velocityY;
                    char newDirection = directions[random.nextInt(4)];
                    ghost.updateDirection(newDirection);
                }
            }
        }

        // pellet collision
        Entity pelletEaten = null;
        for (Entity pellet : pellets) {
            if (intersects(hero, pellet)) {
                pelletEaten = pellet;
                score += 10;
            }
        }
        pellets.remove(pelletEaten);

        if (pellets.isEmpty()) {
            parseLevel();
            resetEntities();
        }
    }

    public boolean intersects(Entity a, Entity b) {
        return  a.x < b.x + b.width &&
                a.x + a.width > b.x &&
                a.y < b.y + b.height &&
                a.y + a.height > b.y;
    }

    public void resetEntities() {
        hero.reset();
        hero.velocityX = 0;
        hero.velocityY = 0;
        for (Entity ghost : specters) {
            ghost.reset();
            char newDirection = directions[random.nextInt(4)];
            ghost.updateDirection(newDirection);
        }
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        updateGame();
        repaint();
        if (gameOver) {
            gameLoop.stop();
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    @Override
    public void keyPressed(KeyEvent e) {}

    @Override
    public void keyReleased(KeyEvent e) {
        if (gameOver) {
            parseLevel();
            resetEntities();
            lives = 3;
            score = 0;
            gameOver = false;
            gameLoop.start();
        }
        // System.out.println("KeyEvent: " + e.getKeyCode());
        if (e.getKeyCode() == KeyEvent.VK_UP) {
            hero.updateDirection('U');
        } else if (e.getKeyCode() == KeyEvent.VK_DOWN) {
            hero.updateDirection('D');
        } else if (e.getKeyCode() == KeyEvent.VK_LEFT) {
            hero.updateDirection('L');
        } else if (e.getKeyCode() == KeyEvent.VK_RIGHT) {
            hero.updateDirection('R');
        }

        if (hero.direction == 'U') {
            hero.image = pacmanUpImage;
        } else if (hero.direction == 'D') {
            hero.image = pacmanDownImage;
        } else if (hero.direction == 'L') {
            hero.image = pacmanLeftImage;
        } else if (hero.direction == 'R') {
            hero.image = pacmanRightImage;
        }
    }
}
