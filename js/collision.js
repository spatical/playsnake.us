// Check for collision between two objects using AABB
function isCollision(obj1, obj2, size) {
    return (
        obj1.x < obj2.x + size &&
        obj1.x + size > obj2.x &&
        obj1.y < obj2.y + size &&
        obj1.y + size > obj2.y
    );
}

// Check for collision with the snake itself using AABB
function isSelfCollision(snake, size) {
    const [head, ...body] = snake;
    for (const segment of body) {
        if (isCollision(head, segment, size)) return true;
    }
    return false;
}

// Check for collision with any array of objects using AABB (walls, food)
function checkCollisions(head, objects, size) {
    for (const obj of objects) {
        if (isCollision(head, obj, size)) return true;
    }
    return false;
}

// Attach the functions to the global window object
window.isCollision = isCollision;
window.isSelfCollision = isSelfCollision;
window.checkCollisions = checkCollisions;
