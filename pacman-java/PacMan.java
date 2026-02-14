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
    int initialLives;
    int gameLoopDelay;
    int introTicksRemaining = 0;
    int visualTick = 0;
    Runnable quitAction;
    boolean gameOver = false;

    PacMan() {
        this(50, 3, null);
    }

    PacMan(int gameLoopDelay, int initialLives) {
        this(gameLoopDelay, initialLives, null);
    }

    PacMan(int gameLoopDelay, int initialLives, Runnable quitAction) {
        this.gameLoopDelay = gameLoopDelay;
        this.initialLives = initialLives;
        this.lives = initialLives;
        this.quitAction = quitAction;

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
        startRoundIntro();
        //how long it takes to start timer, milliseconds gone between frames
        gameLoop = new Timer(gameLoopDelay, this);
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
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        GradientPaint bgGradient = new GradientPaint(
                0,
                0,
                new Color(8, 8, 26),
                0,
                boardHeight,
                new Color(18, 6, 48)
        );
        g2.setPaint(bgGradient);
        g2.fillRect(0, 0, boardWidth, boardHeight);

        g2.setColor(new Color(120, 180, 255, 18));
        for (int x = 0; x < boardWidth; x += tileSize) {
            g2.drawLine(x, 0, x, boardHeight);
        }
        for (int y = 0; y < boardHeight; y += tileSize) {
            g2.drawLine(0, y, boardWidth, y);
        }

        int scanY = (visualTick * 4) % boardHeight;
        g2.setColor(new Color(130, 255, 255, 28));
        g2.fillRect(0, scanY, boardWidth, 3);

        for (Entity wall : wallTiles) {
            g2.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height, null);
            g2.setColor(new Color(70, 180, 255, 52));
            g2.fillRoundRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4, 6, 6);
            g2.setColor(new Color(125, 235, 255, 120));
            g2.drawRoundRect(wall.x + 1, wall.y + 1, wall.width - 3, wall.height - 3, 6, 6);
        }

        for (Entity pellet : pellets) {
            int pulseSize = ((visualTick / 4) % 2 == 0) ? 4 : 2;
            g2.setColor(new Color(255, 245, 190, 70));
            g2.fillOval(pellet.x - pulseSize / 2, pellet.y - pulseSize / 2, pellet.width + pulseSize, pellet.height + pulseSize);
            g2.setColor(new Color(255, 230, 160));
            g2.fillOval(pellet.x, pellet.y, pellet.width, pellet.height);
        }

        for (Entity ghost : specters) {
            g2.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height, null);
        }
        g2.drawImage(hero.image, hero.x, hero.y, hero.width, hero.height, null);

        g2.setColor(new Color(5, 7, 20, 210));
        g2.fillRoundRect(8, 6, boardWidth - 16, 30, 10, 10);
        g2.setColor(new Color(100, 225, 255, 110));
        g2.drawRoundRect(8, 6, boardWidth - 16, 30, 10, 10);

        g2.setFont(new Font("Monospaced", Font.BOLD, 16));
        String hudText = gameOver
            ? "GAME OVER   SCORE " + score + "   PRESS ANY KEY"
            : "SCORE " + score + "   Q MENU";

        int hudX = 20;
        int hudY = 27;
        g2.setColor(new Color(0, 0, 0, 180));
        g2.drawString(hudText, hudX + 2, hudY + 2);
        g2.setColor(gameOver ? new Color(255, 96, 96) : new Color(255, 230, 92));
        g2.drawString(hudText, hudX, hudY);

        int livesStartX = boardWidth - 22 - (lives * 20);
        for (int i = 0; i < lives; i++) {
            g2.drawImage(pacmanRightImage, livesStartX + (i * 20), 12, 16, 16, null);
        }

        if (!gameOver && introTicksRemaining > 0) {
            String readyText = "READY!";
            g2.setFont(new Font("Monospaced", Font.BOLD, 34));
            FontMetrics fontMetrics = g2.getFontMetrics();
            int textX = (boardWidth - fontMetrics.stringWidth(readyText)) / 2;
            int textY = (boardHeight / 2) + 10;

            g2.setColor(new Color(0, 0, 0, 185));
            g2.fillRoundRect(textX - 24, textY - 38, fontMetrics.stringWidth(readyText) + 48, 52, 10, 10);

            g2.setColor(new Color(255, 255, 255, 90));
            g2.drawString(readyText, textX + 2, textY + 2);
            g2.setColor(new Color(255, 225, 70));
            g2.drawString(readyText, textX, textY);
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
                playHitSound();
                if (lives == 0) {
                    gameOver = true;
                    playGameOverSound();
                    return;
                }
                resetEntities();
                startRoundIntro();
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
            startRoundIntro();
        }
    }

    private void startRoundIntro() {
        introTicksRemaining = Math.max(1, 1200 / gameLoopDelay);
        playStartSound();
    }

    private void playBeepPattern(int beepCount, int pauseMillis) {
        Thread soundThread = new Thread(() -> {
            for (int i = 0; i < beepCount; i++) {
                Toolkit.getDefaultToolkit().beep();
                try {
                    Thread.sleep(pauseMillis);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        });
        soundThread.setDaemon(true);
        soundThread.start();
    }

    private void playStartSound() {
        playBeepPattern(2, 120);
    }

    private void playHitSound() {
        playBeepPattern(1, 80);
    }

    private void playGameOverSound() {
        playBeepPattern(3, 170);
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
        if (introTicksRemaining > 0) {
            introTicksRemaining--;
        } else {
            updateGame();
        }
        visualTick++;
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
        if (e.getKeyCode() == KeyEvent.VK_Q) {
            gameLoop.stop();
            if (quitAction != null) {
                quitAction.run();
            } else {
                Window window = SwingUtilities.getWindowAncestor(this);
                if (window != null) {
                    window.dispose();
                }
            }
            return;
        }

        if (gameOver) {
            parseLevel();
            resetEntities();
            lives = initialLives;
            score = 0;
            gameOver = false;
            startRoundIntro();
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
